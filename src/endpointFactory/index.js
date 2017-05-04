import defaultTargetGroupFactory from './defaultTargetGroupFactory'
import listenerFactory, {PROTOCOLS} from './listenerFactory'
import loadBalancerFactory from './loadBalancerFactory'
import {getEnvironmentName} from '../util'

export default function endpointFactory (options = {}) {
  const {environmentName = getEnvironmentName()} = options

  const defaultTargetGroup = defaultTargetGroupFactory({environmentName})
  const loadBalancer = loadBalancerFactory({environmentName})
  const [httpListener, httpsListener] = [PROTOCOLS.HTTP, PROTOCOLS.HTTPS].map(function (protocol) {
    return listenerFactory({
      defaultTargetGroup,
      loadBalancer,
      protocol,
    })
  })

  async function create () {
    await loadBalancer.create()
    await defaultTargetGroup.create()
    await httpListener.create()
    await httpsListener.create()
  }

  async function destroy () {
    await loadBalancer.destroy() // destroys listeners too
    await defaultTargetGroup.destroy()
  }

  return {
    create,
    destroy,
    defaultTargetGroup,
  }
}