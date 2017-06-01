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
  ECS_OPTIMIZED_AMI_ID: 'ami-62745007', // region-specific
  ENVIRONMENT_NAMES,
  REGION: 'us-east-2',
}
