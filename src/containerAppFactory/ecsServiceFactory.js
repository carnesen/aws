'use strict'
const {CONTAINER_NAME, CONTAINER_PORT} = require('../constants')
const {createLogger, ecs} = require('../util')

module.exports = function ecsServiceFactory (options) {
  const {
    ecsClusterName,
    getIamServiceRoleArn,
    getEcsTaskDefinitionId,
    getElbTargetGroupArn,
    name,
  } = options
  const log = createLogger(`ECS cluster "${ecsClusterName}" service`, name)

  async function create () {
    let services = []
    try {
      const data = await ecs.describeServicesAsync({
        cluster: ecsClusterName,
        services: [name],
      })
      services = data.services
    } catch (ex) {
      if (ex.name !== 'ServiceNotActiveException') {
        // http://docs.aws.amazon.com/AmazonECS/latest/developerguide/delete-service.html
        throw ex
      }
    }
    const taskDefinitionId = await getEcsTaskDefinitionId()
    if (services.length > 0 && services[0].status === 'ACTIVE') {
      log(`Updating to task definition "${taskDefinitionId}"...`)
      await ecs.updateServiceAsync({
        cluster: ecsClusterName,
        service: name,
        taskDefinition: taskDefinitionId,
        desiredCount: 1,
      })
      log('Updated task definition')
    } else {
      log.creating()
      const targetGroupArn = await getElbTargetGroupArn()
      const serviceRoleArn = await getIamServiceRoleArn()
      await ecs.createServiceAsync({
        desiredCount: 1,
        serviceName: name,
        taskDefinition: taskDefinitionId,
        cluster: ecsClusterName,
        deploymentConfiguration: {
          maximumPercent: 200,
          minimumHealthyPercent: 100,
        },
        loadBalancers: [{
          targetGroupArn,
          containerPort: CONTAINER_PORT,
          containerName: CONTAINER_NAME,
        }],
        role: serviceRoleArn,
      })
      log.created()
    }
  }

  // TODO: destroy service

  return {
    create,
  }
}
