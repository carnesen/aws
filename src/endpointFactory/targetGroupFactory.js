import keyMirror from 'keymirror'

import network from '../network'
import {createLogger, elbv2, getEnvironmentName} from '../util'

const CODES = keyMirror({
  TargetGroupNotFound: null,
})

export default function targetGroupFactory (options = {}) {
  const {environmentName = getEnvironmentName(), name} = options

  if (!name) {
    throw new Error('Argument "name" is required')
  }

  const fullName = `${environmentName.toLowerCase()}-${name}`
  const log = createLogger('Target group', fullName)

  async function getArn () {
    let arn
    try {
      const {TargetGroups} = await elbv2.describeTargetGroupsAsync({Names: [fullName]})
      arn = TargetGroups[0].TargetGroupArn
    } catch (ex) {
      if (ex.code !== CODES.TargetGroupNotFound) {
        throw ex
      }
    }
    return arn
  }

  async function create () {
    log.creating()
    const arn = await getArn()
    if (arn) {
      log.alreadyCreated()
    } else {
      const networkId = await network.getId()
      await elbv2.createTargetGroupAsync({
        Name: fullName,
        Protocol: 'HTTP',
        Port: 80, // Overridden when ECS registers targets
        VpcId: networkId,
        HealthCheckProtocol: 'HTTP',
        HealthCheckPort: 'traffic-port',
        HealthCheckPath: '/health',
        HealthCheckIntervalSeconds: 30,
        HealthCheckTimeoutSeconds: 5,
        HealthyThresholdCount: 5,
        UnhealthyThresholdCount: 2,
        Matcher: {HttpCode: '200'},
      })
      log.created()
    }
  }

  async function destroy () {
    log.destroying()
    const arn = await getArn()
    if (arn) {
      await elbv2.deleteTargetGroupAsync({TargetGroupArn: arn})
      log.destroyed()
    } else {
      log.alreadyDestroyed()
    }
  }

  return {
    create,
    destroy,
    getArn,
  }
}
