const keyMirror = require('keymirror')

const {certificate, createLogger, elbv2} = require('../util')

const PROTOCOLS = keyMirror({
  HTTP: null,
  HTTPS: null,
})

function listenerFactory (options = {}) {
  const {
    getDefaultTargetGroupArn,
    getLoadBalancerArn,
    name,
    protocol,
  } = options

  const log = createLogger('Listener', name)

  async function getArn () {
    let arn
    const loadBalancerArn = await getLoadBalancerArn()
    const {Listeners} = await elbv2.describeListenersAsync({LoadBalancerArn: loadBalancerArn})
    const filteredListeners = Listeners.filter(function ({Protocol}) {
      return Protocol === protocol
    })
    if (filteredListeners.length > 0) {
      arn = Listeners[0].ListenerArn
    }
    return arn
  }

  async function create () {
    const loadBalancerArn = await getLoadBalancerArn()
    const defaultTargetGroupArn = await getDefaultTargetGroupArn()
    log.creating()
    const arn = await getArn()
    if (arn) {
      log.alreadyCreated()
    } else {
      // http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/ELBv2.html#createListener-property
      const params = {
        LoadBalancerArn: loadBalancerArn,
        Protocol: protocol,
        Port: protocol === PROTOCOLS.HTTPS ? 443 : 80,
        DefaultActions: [{Type: 'forward', TargetGroupArn: defaultTargetGroupArn}],
      }
      if (protocol === PROTOCOLS.HTTPS) {
        const certificateArn = await certificate.getArn()
        params.Certificates = [{CertificateArn: certificateArn}]
      }
      await elbv2.createListenerAsync(params)
      log.created()
    }
  }

  // Destroying load balancer destroys attached listeners

  return {
    create,
    getArn,
  }
}

listenerFactory.PROTOCOLS = PROTOCOLS

module.exports = listenerFactory
