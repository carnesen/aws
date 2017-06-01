'use strict'
const childProcess = require('child_process')

const Promise = require('bluebird')
const {BRANCH_NAME_MAP, ENVIRONMENT_NAMES} = require('../constants')

module.exports = {
  fs: Promise.promisifyAll(require('fs-extra')),
  certificate: require('./certificate'),
  encodeBase64 (str) {
    return Buffer.from(str).toString('base64')
  },
  getEnvironmentName () {
    let environmentName
    if (process.env.NODE_ENV === 'test') {
      environmentName = ENVIRONMENT_NAMES.devops
    } else {
      const args = 'rev-parse --abbrev-ref HEAD'.split(' ')
      const stdout = childProcess.execFileSync('git', args, {encoding: 'utf8'})
      const branchName = stdout.replace(/\n/g, '')
      environmentName = BRANCH_NAME_MAP[branchName]
      if (!environmentName) {
        environmentName = ENVIRONMENT_NAMES.devops
      }
    }
    return environmentName
  },
  getGitHash () {
    return childProcess.execFileSync(
      'git',
      ['rev-parse', '--short=10', 'HEAD'],
      {encoding: 'utf8'}
    ).replace(/\n/g, '')
  },
  network: require('./network'),
  refuseToDestroy (environmentName) {
    if (environmentName === ENVIRONMENT_NAMES.prod && process.env.FORCE !== 'true') {
      throw new Error(`Refusing to destroy ${ENVIRONMENT_NAMES.prod} unless FORCE=="true"`)
    }
  },
  roleFactory: require('./roleFactory'),
  run: require('./run'),
  targetGroupFactory: require('./targetGroupFactory'),
}

Object.assign(module.exports, require('./logging'))
Object.assign(module.exports, require('./sdkClients'))
