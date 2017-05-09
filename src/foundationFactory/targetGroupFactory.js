import keyMirror from 'keymirror'

import {createLogger, elbv2, network} from '../util'

const CODES = keyMirror({
  TargetGroupNotFound: null,
})

export default function targetGroupFactory ({name}) {
  const log = createLogger('Target group', name)

  async function getArn () {
    let arn
    try {
      const {TargetGroups} = await elbv2.describeTargetGroupsAsync({Names: [name]})
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
      const vpcId = await network.getId()
      await elbv2.createTargetGroupAsync({
        Name: name,
        Protocol: 'HTTP',
        Port: 8000, // overridden when service registers
        VpcId: vpcId,
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
