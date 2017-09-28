'use strict'
const keyMirror = require('keymirror')

const {acmCertificate, createLogger, elbv2} = require('../util')

const PROTOCOLS = keyMirror({
  HTTP: null,
  HTTPS: null,
})

function listenerFactory (options = {}) {
  const {
    getDefaultElbTargetGroupArn,
    getElbLoadBalancerArn,
    name,
    protocol,
  } = options

  const log = createLogger('Listener', name)

  async function getArn () {
    let arn
    const elbLoadBalancerArn = await getElbLoadBalancerArn()
    const {Listeners} = await elbv2.describeListenersAsync({LoadBalancerArn: elbLoadBalancerArn})
    const listener = Listeners.find(function ({Protocol}) {
      return Protocol === protocol
    })
    if (listener) {
      arn = listener.ListenerArn
    }
    return arn
  }

  async function create () {
    const loadBalancerArn = await getElbLoadBalancerArn()
    const defaultElbTargetGroupArn = await getDefaultElbTargetGroupArn()
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
        DefaultActions: [{Type: 'forward', TargetGroupArn: defaultElbTargetGroupArn}],
      }
      if (protocol === PROTOCOLS.HTTPS) {
        const certificateArn = await acmCertificate.getArn()
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
