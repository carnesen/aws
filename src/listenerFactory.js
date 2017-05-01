import Promise from 'bluebird'
import keyMirror from 'keymirror'

import loadBalancerFactory from './loadBalancerFactory'
import defaultTargetGroupFactory from './defaultTargetGroupFactory'
import {certificate, createLogger, elbv2, getEnvironmentName} from './util'

export const PROTOCOLS = keyMirror({
  HTTP: null,
  HTTPS: null,
})

export default function listenerFactory (options = {}) {
  const {environmentName = getEnvironmentName(), protocol} = options

  if (!protocol) {
    throw new Error('Argument "protocol" is required')
  }

  const loadBalancer = loadBalancerFactory({environmentName})
  const defaultTargetGroup = defaultTargetGroupFactory({environmentName})

  const fullName = `${loadBalancer.fullName}-${protocol.toLowerCase()}`
  const log = createLogger('Listener', fullName)

  async function getArn () {
    let arn
    const loadBalancerArn = await loadBalancer.getArn()
    if (loadBalancerArn) {
      const {Listeners} = await elbv2.describeListenersAsync({LoadBalancerArn: loadBalancerArn})
      const filteredListeners = Listeners.filter(function ({Protocol}) {
        return Protocol === protocol
      })
      if (filteredListeners.length > 0) {
        arn = Listeners[0].ListenerArn
      }
    }
    return arn
  }

  async function create () {
    let loadBalancerArn = await loadBalancer.getArn()
    if (!loadBalancerArn) {
      await loadBalancer.create()
      loadBalancerArn = await loadBalancer.getArn()
    }
    let defaultTargetGroupArn = await defaultTargetGroup.getArn()
    if (!defaultTargetGroupArn) {
      await defaultTargetGroup.create()
      defaultTargetGroupArn = await defaultTargetGroup.getArn()
    }
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

  async function destroy () {
    const loadBalancerArn = await loadBalancer.getArn()
    if (loadBalancerArn) {
      await loadBalancer.destroy()
      await Promise.delay(3500)
    }
    const defaultTargetGroupArn = await defaultTargetGroup.getArn()
    if (defaultTargetGroupArn) {
      await defaultTargetGroup.destroy()
    }
    log.destroying()
    const arn = await getArn()
    if (arn) {
      await elbv2.deleteListenerAsync({ListenerArn: arn})
      log.destroyed()
    } else {
      log.alreadyDestroyed()
    }
  }

  return {
    create,
    destroy,
    getArn,
  }
}
