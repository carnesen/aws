'use strict'
const {createLogger, cloudwatchLogs} = require('../util')

module.exports = function cloudwatchLogGroupFactory ({name}) {
  const log = createLogger('Log group', name)

  async function getArn () {
    let arn
    const {logGroups} = await cloudwatchLogs.describeLogGroupsAsync({logGroupNamePrefix: name})
    if (logGroups[0]) {
      arn = logGroups[0].arn
    }
    return arn
  }

  async function create () {
    const arn = await getArn()
    log.creating()
    if (arn) {
      log.alreadyCreated()
    } else {
      await cloudwatchLogs.createLogGroupAsync({logGroupName: name})
      log.created()
    }
  }

  async function destroy () {
    const arn = await getArn()
    log.destroying()
    if (!arn) {
      log.alreadyDestroyed()
    } else {
      await cloudwatchLogs.deleteLogGroupAsync({logGroupName: name})
      log.destroyed()
    }
  }

  return {
    create,
    destroy,
    getArn,
    name,
  }
}
