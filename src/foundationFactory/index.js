'use strict'
const ecsClusterFactory = require('./ecsClusterFactory')
const ec2InstanceFactory = require('./ec2InstanceFactory')
const instanceProfileFactory = require('./ec2InstanceProfileFactory')
const ec2KeyPairFactory = require('./ec2KeyPairFactory')
const elbListenerFactory = require('./elbListenerFactory')
const elbLoadBalancerFactory = require('./elbLoadBalancerFactory')

const {getEnvironmentName, iamRoleFactory, refuseToDestroy, elbTargetGroupFactory} = require('../util')

const {PROTOCOLS} = elbListenerFactory

module.exports = function foundationFactory (options = {}) {
  const {environmentName = getEnvironmentName()} = options
  const ecsCluster = ecsClusterFactory({name: environmentName})
  const ec2InstanceProfile = instanceProfileFactory({name: environmentName})
  const ec2KeyPair = ec2KeyPairFactory({name: environmentName})
  const ec2Instance = ec2InstanceFactory({
    ecsClusterName: ecsCluster.name,
    getEc2InstanceProfileArn: ec2InstanceProfile.getArn,
    ec2KeyPairName: ec2KeyPair.name,
    name: environmentName,
  })
  const elbLoadBalancer = elbLoadBalancerFactory({name: environmentName})
  const defaultElbTargetGroup = elbTargetGroupFactory({name: `${environmentName}-default`})
  const [httpElbListener, httpsElbListener] = [PROTOCOLS.HTTP, PROTOCOLS.HTTPS].map(function (protocol) {
    return elbListenerFactory({
      getDefaultElbTargetGroupArn: defaultElbTargetGroup.getArn,
      getElbLoadBalancerArn: elbLoadBalancer.getArn,
      name: `${environmentName}-${protocol.toLowerCase()}`,
      protocol,
    })
  })

  const iamServiceRole = iamRoleFactory({
    name: `${environmentName}-container-service`,
    trustedService: 'ecs.amazonaws.com',
    policyArn: 'arn:aws:iam::aws:policy/service-role/AmazonEC2ContainerServiceRole',
  })

  async function create () {
    await iamServiceRole.create()
    await ecsCluster.create()
    await ec2InstanceProfile.create()
    await ec2KeyPair.create()
    await ec2Instance.create()
    await elbLoadBalancer.create()
    await defaultElbTargetGroup.create()
    await httpElbListener.create()
    await httpsElbListener.create()
  }

  async function destroy () {
    refuseToDestroy(environmentName)
    await elbLoadBalancer.destroy() // destroys elbListeners too
    await defaultElbTargetGroup.destroy()
    await ec2Instance.destroy()
    await ec2KeyPair.destroy()
    await ec2InstanceProfile.destroy()
    await ecsCluster.destroy()
    await iamServiceRole.destroy()
  }

  return {
    ecsClusterName: ecsCluster.name,
    create,
    destroy,
    getDefaultElbTargetGroupArn: defaultElbTargetGroup.getArn,
    getHttpsElbListenerArn: httpsElbListener.getArn,
    getIamServiceRoleArn: iamServiceRole.getArn,
  }
}
