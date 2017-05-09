import fs from 'fs-extra'
import Promise from 'bluebird'
import {ENVIRONMENT_NAMES} from '../constants'

export {default as certificate} from './certificate'
export {default as createLogger} from './createLogger'
export {default as network} from './network'
export {default as roleFactory} from './roleFactory'
export * from './sdkClients'

Promise.promisifyAll(fs)

export {fs}

export function getEnvironmentName () {
  return ENVIRONMENT_NAMES.devops
}

export function encodeBase64 (str) {
  return Buffer.from(str).toString('base64')
}
