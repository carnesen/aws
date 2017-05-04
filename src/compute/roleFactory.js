import keyMirror from 'keymirror'
import Promise from 'bluebird'

import {createLogger, getEnvironmentName, iam} from '../util'

const CODES = keyMirror({
  NoSuchEntity: null,
})

export default function roleFactory(options = {}) {
  const {environmentName = getEnvironmentName(), name, trustedService, policyArn} = options
  const fullName = `${name}-${environmentName.toLowerCase()}`
  const log = createLogger('IAM role', fullName)

  async function getArn () {
    let arn
    try {
      const {Role} = await iam.getRoleAsync({RoleName: fullName})
      arn = Role.Arn
    } catch (ex) {
      if (ex.code !== CODES.NoSuchEntity) {
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
      const document = {
        Version: '2012-10-17',
        Statement: [{
          Effect: 'Allow',
          Principal: {'Service': trustedService},
          Action: 'sts:AssumeRole',
        }]
      }
      await iam.createRoleAsync({
        RoleName: fullName,
        AssumeRolePolicyDocument: JSON.stringify(document, null, 2)
      })
      await Promise.delay(1000)
    }
    await iam.attachRolePolicyAsync({
      RoleName: fullName,
      PolicyArn: policyArn,
    })
    log.created()
  }

  async function destroy () {
    log.destroying()
    const arn = await getArn()
    if (!arn) {
      log.alreadyDestroyed()
    } else {
      const {AttachedPolicies} = await iam.listAttachedRolePoliciesAsync({RoleName: fullName})
      for (let {PolicyArn} of AttachedPolicies) {
        await iam.detachRolePolicyAsync({RoleName: fullName, PolicyArn})
      }
      await iam.deleteRoleAsync({RoleName: fullName})
    }
  }

  return {
    create,
    destroy,
    fullName,
    getArn,
  }
}
