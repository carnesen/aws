const {createLogger, cwl} = require('../util')

module.exports = function logGroupFactory ({name}) {
  const log = createLogger('Log group', name)

  async function getArn () {
    let arn
    const {logGroups} = await cwl.describeLogGroupsAsync({logGroupNamePrefix: name})
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
      await cwl.createLogGroupAsync({logGroupName: name})
      log.created()
    }
  }

  async function destroy () {
    const arn = await getArn()
    log.destroying()
    if (!arn) {
      log.alreadyDestroyed()
    } else {
      await cwl.deleteLogGroupAsync({logGroupName: name})
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
