import {ENVIRONMENT_NAMES} from '../constants'

export {default as createLogger} from './createLogger'
export {default as certificate} from './certificate'
export {default as network} from './network'
export * from './sdkClients'

export function getEnvironmentName () {
  return ENVIRONMENT_NAMES.DEVOPS
}

export function getPackageDir () {
  return process.cwd()
}
