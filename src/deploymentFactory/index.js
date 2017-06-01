'use strict'
const {DOMAIN_NAME, ENVIRONMENT_NAMES} = require('../constants')
const foundationFactory = require('../foundationFactory')
const logGroupFactory = require('./logGroupFactory')
const repositoryFactory = require('./repositoryFactory')
const ruleFactory = require('./ruleFactory')
const taskDefinitionFactory = require('./taskDefinitionFactory')
const serviceFactory = require('./serviceFactory')
const {getEnvironmentName, refuseToDestroy, targetGroupFactory} = require('../util')

module.exports = function deploymentFactory (options = {}) {
  const {
    environmentName = getEnvironmentName(),
    packageDir = process.cwd(),
    priority,
  } = options

  const {
    clusterName,
    getServiceRoleArn,
    getDefaultTargetGroupArn,
    getHttpsListenerArn,
  } = foundationFactory({environmentName})

  const usingDefaultTargetGroup = priority === -1

  const repository = repositoryFactory({environmentName, packageDir})

  const logGroup = logGroupFactory({name: `${environmentName}/${repository.packageName}`})

  const taskDefinition = taskDefinitionFactory({
    async getImageName () {
      await repository.buildImage()
      return repository.pushImage()
    },
    logGroupName: logGroup.name,
    name: `${environmentName}-${repository.packageName}`,
  })

  const targetGroup = targetGroupFactory({
    name: `${environmentName}-${repository.packageName}`,
  })

  let hostHeader = repository.packageName
  if (environmentName !== ENVIRONMENT_NAMES.prod) {
    hostHeader += `${-environmentName}`
  }
  hostHeader += `.${DOMAIN_NAME}`

  const rule = ruleFactory({
    getListenerArn: getHttpsListenerArn,
    getTargetGroupArn: targetGroup.getArn,
    hostHeader: hostHeader,
    priority: priority,
  })

  const service = serviceFactory({
    clusterName,
    getServiceRoleArn,
    getTargetGroupArn: usingDefaultTargetGroup ? getDefaultTargetGroupArn : targetGroup.getArn,
    getTaskDefinitionId: taskDefinition.create,
    name: repository.packageName,
  })

  async function create () {
    await logGroup.create()
    await repository.create()
    if (!usingDefaultTargetGroup) {
      await targetGroup.create()
      await rule.create()
    }
    await service.create()
  }

  async function destroy () {
    refuseToDestroy(environmentName)
    await repository.destroy()
    await logGroup.destroy()
    if (!usingDefaultTargetGroup) {
      await rule.destroy()
      await targetGroup.destroy()
    }
  }

  return {
    create,
    destroy,
  }
}
