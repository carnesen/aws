'use strict'
const keyMirror = require('keymirror')
const Promise = require('bluebird')

const {createLogger} = require('./logging')
const {iam} = require('./awsSdkClients')

const CODES = keyMirror({
  NoSuchEntity: null,
})

module.exports = function roleFactory ({name, trustedService, policyArn}) {
  const log = createLogger('IAM role', name)

  async function getArn () {
    let arn
    try {
      const {Role} = await iam.getRoleAsync({RoleName: name})
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
        }],
      }
      await iam.createRoleAsync({
        RoleName: name,
        AssumeRolePolicyDocument: JSON.stringify(document, null, 2),
      })
      await Promise.delay(1000)
    }
    await iam.attachRolePolicyAsync({
      RoleName: name,
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
      const {AttachedPolicies} = await iam.listAttachedRolePoliciesAsync({RoleName: name})
      for (let {PolicyArn} of AttachedPolicies) {
        await iam.detachRolePolicyAsync({RoleName: name, PolicyArn})
      }
      await iam.deleteRoleAsync({RoleName: name})
    }
  }

  return {
    create,
    destroy,
    getArn,
    name,
  }
}
