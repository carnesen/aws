import keyMirror from 'keymirror'

import {createLogger, getEnvironmentName, iam} from '../util'

const CODES = keyMirror({
  LimitExceeded: null,
})

export default function instanceProfileFactory (options = {}) {
  const {environmentName = getEnvironmentName()} = options

  const fullName = environmentName.toLowerCase()

  const log = createLogger('EC2 instance profile', fullName)

  async function getArn () {
    let arn
    const {InstanceProfiles} = await iam.listInstanceProfilesAsync()
    const filteredInstanceProfiles = InstanceProfiles.filter(function ({InstanceProfileName}) {
      return InstanceProfileName === fullName
    })
    if (filteredInstanceProfiles.length === 1) {
      arn = filteredInstanceProfiles[0].Arn
    }
    return arn
  }

  async function create () {
    const arn = await getArn()
    log.creating()
    if (arn) {
      log.alreadyCreated()
    } else {
      await iam.createInstanceProfileAsync({InstanceProfileName: fullName})
    }
  }

  async function destroy () {
    const arn = await getArn()
    log.destroying()
    if (!arn) {
      log.alreadyDestroyed()
    } else {
      await iam.deleteInstanceProfileAsync({InstanceProfileName: fullName})
      log.destroyed()
    }
  }

  async function attachRole(roleName) {
    log(`Attaching role "${roleName}"`)
    try {
      await iam.addRoleToInstanceProfileAsync({
        InstanceProfileName: fullName,
        RoleName: roleName,
      })
      log(`Attached role "${roleName}`)
    } catch (ex) {
      if (ex.code !== CODES.LimitExceeded) {
        throw ex
      } else {
        log(`Already has a role attached`)
      }
    }
  }

  return {
    attachRole,
    create,
    destroy,
    getArn,
  }
}