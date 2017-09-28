'use strict'
const {CONTAINER_NAME, CONTAINER_PORT, REGION} = require('../constants')
const {createLogger, ecs} = require('../util')

module.exports = function taskDefinitionFactory (options = {}) {
  const {
    name,
    getImageName,
    logGroupName,
  } = options

  const log = createLogger('ECS task definition', name)

  async function create () {
    const imageName = await getImageName()
    log.creating()
    const {taskDefinition: {revision}} = await ecs.registerTaskDefinitionAsync({
      containerDefinitions: [{
        cpu: 0,
        environment: [
          {
            name: 'NODE_ENV',
            value: 'production',
          },
        ],
        essential: true,
        image: imageName,
        logConfiguration: {
          logDriver: 'awslogs',
          options: {
            'awslogs-group': logGroupName,
            'awslogs-region': REGION,
            'awslogs-stream-prefix': logGroupName,
          },
        },
        memory: 100, // hard limit in MB
        name: CONTAINER_NAME,
        portMappings: [{
          containerPort: CONTAINER_PORT,
          hostPort: 0,
          protocol: 'tcp',
        }],
      }],
      family: name,
      networkMode: 'bridge',
      taskRoleArn: '',
    })
    log.created()
    return `${name}:${revision}`
  }

  return {
    create,
  }
}
