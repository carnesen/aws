'use strict'
const {createLogger, elbv2} = require('../util')

module.exports = function ruleFactory (options = {}) {
  const {
    getListenerArn,
    getTargetGroupArn,
    hostHeader,
    priority,
  } = options

  const log = createLogger('ELB rule', hostHeader)

  async function getArn () {
    let arn
    const listenerArn = await getListenerArn()
    if (!listenerArn) {
      throw new Error('Failed to get listener arn')
    } else {
      const {Rules} = await elbv2.describeRulesAsync({ListenerArn: listenerArn})
      const matchingRule = Rules.find(function (rule) {
        return rule.Priority === priority.toString()
      })
      if (matchingRule) {
        const exitingHostHeader = matchingRule.Conditions[0].Values[0]
        if (exitingHostHeader !== hostHeader) {
          throw new Error(`Priority ${priority} rule already exists for "${exitingHostHeader}"`)
        }
        arn = matchingRule.RuleArn
      }
    }
    return arn
  }

  async function create () {
    const arn = await getArn()
    log.creating()
    if (arn) {
      log.alreadyCreated()
    } else {
      const TargetGroupArn = await getTargetGroupArn()
      const ListenerArn = await getListenerArn()
      await elbv2.createRuleAsync({
        Actions: [{
          TargetGroupArn,
          Type: 'forward',
        }],
        Conditions: [{
          Field: 'host-header',
          Values: [hostHeader],
        }],
        ListenerArn,
        Priority: priority,
      })
      log.created()
    }
  }

  async function destroy () {
    const arn = await getArn()
    log.destroying()
    if (arn) {
      log.alreadyDestroyed()
    } else {
      await elbv2.deleteRuleAsync({RuleArn: arn})
      log.destroyed()
    }
  }

  return {
    create,
    destroy,
  }
}
