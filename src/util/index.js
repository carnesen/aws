import fs from 'fs-extra'
import Promise from 'bluebird'
import {ENVIRONMENT_NAMES} from '../constants'

export {default as createLogger} from './createLogger'
export * from './sdkClients'

Promise.promisifyAll(fs)

export {fs}

export function getEnvironmentName () {
  return ENVIRONMENT_NAMES.DEVOPS
}

export function getPackageDir () {
  return process.cwd()
}

export function encodeBase64(str) {
  return Buffer.from(str).toString('base64')
}
