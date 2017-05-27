'use strict'
const {CONTAINER_NAME, CONTAINER_PORT} = require('../constants')
const {createLogger, ecs} = require('../util')

module.exports = function serviceFactory ({clusterName, getServiceRoleArn, getTaskDefinitionId, getTargetGroupArn, name}) {
  const log = createLogger(`ECS cluster "${clusterName}" service`, name)

  async function create () {
    let services = []
    try {
      const data = await ecs.describeServicesAsync({
        cluster: clusterName,
        services: [name],
      })
      services = data.services
    } catch (ex) {
      if (ex.name !== 'ServiceNotActiveException') {
        // http://docs.aws.amazon.com/AmazonECS/latest/developerguide/delete-service.html
        throw ex
      }
    }
    const taskDefinitionId = await getTaskDefinitionId()
    if (services.length > 0 && services[0].status === 'ACTIVE') {
      log(`Updating to task definition "${taskDefinitionId}"...`)
      await ecs.updateServiceAsync({
        cluster: clusterName,
        service: name,
        taskDefinition: taskDefinitionId,
        desiredCount: 1,
      })
      log('Updated task definition')
    } else {
      log.creating()
      const targetGroupArn = await getTargetGroupArn()
      const serviceRoleArn = await getServiceRoleArn()
      await ecs.createServiceAsync({
        desiredCount: 1,
        serviceName: name,
        taskDefinition: taskDefinitionId,
        cluster: clusterName,
        deploymentConfiguration: {
          maximumPercent: 200,
          minimumHealthyPercent: 100,
          role: serviceRoleArn,
          loadBalancers: [{
            targetGroupArn,
            containerPort: CONTAINER_PORT,
            containerName: CONTAINER_NAME,
          }],
        },
      })
      log.created()
    }
  }

  return {
    create,
  }
}
