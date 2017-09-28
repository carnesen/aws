'use strict'
const {DOMAIN_NAME, ENVIRONMENT_NAMES} = require('../constants')
const foundationFactory = require('../foundationFactory')
const {getEnvironmentName, refuseToDestroy, elbTargetGroupFactory} = require('../util')

const cloudwatchLogGroupFactory = require('./cloudwatchLogGroupFactory')
const ecsRepositoryFactory = require('./ecsRepositoryFactory')
const elbRuleFactory = require('./elbRuleFactory')
const ecsServiceFactory = require('./ecsServiceFactory')
const ecsTaskDefinitionFactory = require('./ecsTaskDefinitionFactory')

module.exports = function containerAppFactory (options = {}) {
  const {
    environmentName = getEnvironmentName(),
    packageDir = process.cwd(),
    priority,
  } = options

  const {
    ecsClusterName,
    getIamServiceRoleArn,
    getDefaultElbTargetGroupArn,
    getHttpsElbListenerArn,
  } = foundationFactory({environmentName})

  const usingDefaultTargetGroup = priority === -1

  const ecsRepository = ecsRepositoryFactory({environmentName, packageDir})

  const cloudwatchLogGroup = cloudwatchLogGroupFactory({name: `${environmentName}/${ecsRepository.packageName}`})

  const ecsTaskDefinition = ecsTaskDefinitionFactory({
    async getImageName () {
      await ecsRepository.buildImage()
      return ecsRepository.pushImage()
    },
    logGroupName: cloudwatchLogGroup.name,
    name: `${environmentName}-${ecsRepository.packageName}`,
  })

  const elbTargetGroup = elbTargetGroupFactory({
    name: `${environmentName}-${ecsRepository.packageName}`,
  })

  let hostHeader = ecsRepository.packageName
  if (environmentName !== ENVIRONMENT_NAMES.prod) {
    hostHeader += `${-environmentName}`
  }
  hostHeader += `.${DOMAIN_NAME}`

  const rule = elbRuleFactory({
    getElbListenerArn: getHttpsElbListenerArn,
    getElbTargetGroupArn: elbTargetGroup.getArn,
    hostHeader: hostHeader,
    priority: priority,
  })

  const ecsService = ecsServiceFactory({
    ecsClusterName,
    getIamServiceRoleArn,
    getElbTargetGroupArn: usingDefaultTargetGroup ? getDefaultElbTargetGroupArn : elbTargetGroup.getArn,
    getEcsTaskDefinitionId: ecsTaskDefinition.create,
    name: ecsRepository.packageName,
  })

  async function create () {
    await cloudwatchLogGroup.create()
    await ecsRepository.create()
    if (!usingDefaultTargetGroup) {
      await elbTargetGroup.create()
      await rule.create()
    }
    await ecsService.create()
  }

  async function destroy () {
    refuseToDestroy(environmentName)
    await ecsRepository.destroy()
    await cloudwatchLogGroup.destroy()
    if (!usingDefaultTargetGroup) {
      await rule.destroy()
      await elbTargetGroup.destroy()
    }
  }

  return {
    create,
    destroy,
  }
}
