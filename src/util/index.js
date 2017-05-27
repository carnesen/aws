const Promise = require('bluebird')
const {ENVIRONMENT_NAMES} = require('../constants')

module.exports = {
  fs: Promise.promisifyAll(require('fs-extra')),
  certificate: require('./certificate'),
  encodeBase64 (str) {
    return Buffer.from(str).toString('base64')
  },
  getEnvironmentName () {
    return ENVIRONMENT_NAMES.devops
  },
  network: require('./network'),
  roleFactory: require('./roleFactory'),
  run: require('./run'),
}

Object.assign(module.exports, require('./logging'))
Object.assign(module.exports, require('./sdkClients'))
