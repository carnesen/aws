'use strict'
const {CONTAINER_NAME, CONTAINER_PORT, REGION} = require('../constants')
const {createLogger, ecs} = require('../util')

function getRandomUid () {
  const min = 1000000
  const max = 4000000
  return Math.floor(Math.random() * (max - min)) + min
}

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
    const {taskDefinition: {revision}} = ecs.registerTaskDefinitionAsync({
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
        portMappings: {
          containerPort: CONTAINER_PORT,
          hostPort: 0,
          protocol: 'tcp',
        },
        user: getRandomUid(),
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
