import clusterFactory from './clusterFactory'
import instanceFactory from './instanceFactory'
import instanceProfileFactory from './instanceProfileFactory'
import keyPairFactory from './keyPairFactory'
import listenerFactory, {PROTOCOLS} from './listenerFactory'
import loadBalancerFactory from './loadBalancerFactory'
import targetGroupFactory from './targetGroupFactory'

import {getEnvironmentName, roleFactory} from '../util'

export default function foundationFactory (options = {}) {
  const {environmentName = getEnvironmentName()} = options
  const cluster = clusterFactory({name: environmentName})
  const instanceProfile = instanceProfileFactory({name: environmentName})
  const keyPair = keyPairFactory({name: environmentName})
  const instance = instanceFactory({
    clusterName: cluster.name,
    getInstanceProfileArn: instanceProfile.getArn,
    keyPairName: keyPair.name,
    name: environmentName,
  })
  const loadBalancer = loadBalancerFactory({name: environmentName})
  const defaultTargetGroup = targetGroupFactory({name: `${environmentName}-default`})
  const [httpListener, httpsListener] = [PROTOCOLS.HTTP, PROTOCOLS.HTTPS].map(function (protocol) {
    return listenerFactory({
      getDefaultTargetGroupArn: defaultTargetGroup.getArn,
      getLoadBalancerArn: loadBalancer.getArn,
      name: `${environmentName}-${protocol.toLowerCase()}`,
      protocol,
    })
  })

  const serviceRole = roleFactory({
    name: `${environmentName}-container-service`,
    trustedService: 'ecs.amazonaws.com',
    policyArn: 'arn:aws:iam::aws:policy/service-role/AmazonEC2ContainerServiceRole',
  })

  async function create () {
    await serviceRole.create()
    await cluster.create()
    await instanceProfile.create()
    await keyPair.create()
    await instance.create()
    await loadBalancer.create()
    await defaultTargetGroup.create()
    await httpListener.create()
    await httpsListener.create()
  }

  async function destroy () {
    await loadBalancer.destroy() // destroys listeners too
    await defaultTargetGroup.destroy()
    await instance.destroy()
    await keyPair.destroy()
    await instanceProfile.destroy()
    await cluster.destroy()
    await serviceRole.destroy()
  }

  return {
    clusterName: cluster.name,
    create,
    destroy,
    getDefaultTargetGroupArn: defaultTargetGroup.getArn,
    getServiceRoleArn: serviceRole.getArn,
  }
}
