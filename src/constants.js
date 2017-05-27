'use strict'
const keyMirror = require('keymirror')

module.exports = {
  CONTAINER_PORT: 8000,
  CONTAINER_NAME: 'app',
  DOMAIN_NAME: 'carnesen.com',
  ECS_OPTIMIZED_AMI_ID: 'ami-62745007', // region-specific
  ENVIRONMENT_NAMES: keyMirror({
    devops: null,
    test: null,
    prod: null,
  }),
  REGION: 'us-east-2',
}
