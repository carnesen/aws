'use strict'
const keyMirror = require('keymirror')

const ENVIRONMENT_NAMES = keyMirror({
  devops: null,
  prod: null,
})

module.exports = {
  BRANCH_NAME_MAP: {
    master: ENVIRONMENT_NAMES.prod,
  },
  CONTAINER_PORT: 8000,
  CONTAINER_NAME: 'app',
  DOMAIN_NAME: 'carnesen.com',
  ECS_OPTIMIZED_AMI_ID: 'ami-9eb4b1e5', // region-specific http://docs.aws.amazon.com/AmazonECS/latest/developerguide/ecs-optimized_AMI.html
  ENVIRONMENT_NAMES,
  REGION: 'us-east-1',
}
