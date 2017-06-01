'use strict'
const {run, getGitHash} = require('./util')

module.exports = {
  deploymentFactory: require('./deploymentFactory'),
  foundationFactory: require('./foundationFactory'),
  getGitHash,
  run,
}
