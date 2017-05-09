import keyMirror from 'keymirror'

export const ENVIRONMENT_NAMES = keyMirror({
  devops: null,
  test: null,
  prod: null,
})

export const DOMAIN_NAME = 'carnesen.com'

export const REGION = 'us-east-2'
export const ECS_OPTIMIZED_AMI_ID = 'ami-62745007' // region-specific

export const CONTAINER_PORT = 8000
export const CONTAINER_NAME = 'app'
