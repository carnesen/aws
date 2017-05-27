const Promise = require('bluebird')
const keyMirror = require('keymirror')

const {createLogger, iam, roleFactory} = require('../util')

const CODES = keyMirror({
  LimitExceeded: null,
  NoSuchEntity: null,
})

module.exports = function instanceProfileFactory ({name}) {
  const log = createLogger('EC2 instance profile', name)

  const role = roleFactory({
    name,
    trustedService: 'ec2.amazonaws.com',
    policyArn: 'arn:aws:iam::aws:policy/service-role/AmazonEC2ContainerServiceforEC2Role',
  })

  async function getArn () {
    let arn
    const {InstanceProfiles} = await iam.listInstanceProfilesAsync()
    const filteredInstanceProfiles = InstanceProfiles.filter(function ({InstanceProfileName}) {
      return InstanceProfileName === name
    })
    if (filteredInstanceProfiles.length === 1) {
      arn = filteredInstanceProfiles[0].Arn
    }
    return arn
  }

  async function attachRole () {
    log(`Attaching role "${name}"`)
    try {
      await iam.addRoleToInstanceProfileAsync({
        InstanceProfileName: name,
        RoleName: name,
      })
      const intervalSeconds = 8
      log(`Waiting ${intervalSeconds} seconds to avoid "Invalid IAM Instance Profile ARN"`)
      await Promise.delay(intervalSeconds * 1000)
      log(`Attached role`)
    } catch (ex) {
      if (ex.code !== CODES.LimitExceeded) {
        throw ex
      } else {
        log(`Already has a role attached`)
      }
    }
  }

  async function detachRole () {
    log(`Detaching role "${name}" ...`)
    try {
      await iam.removeRoleFromInstanceProfileAsync({
        InstanceProfileName: name,
        RoleName: name,
      })
      log('Detached role')
    } catch (ex) {
      if (ex.code === CODES.NoSuchEntity) {
        log('Role is already detached')
      } else {
        throw ex
      }
    }
  }

  async function create () {
    const arn = await getArn()
    log.creating()
    if (arn) {
      log.alreadyCreated()
    } else {
      await iam.createInstanceProfileAsync({InstanceProfileName: name})
      log.created()
    }
    await role.create()
    await attachRole()
  }

  async function destroy () {
    const arn = await getArn()
    log.destroying()
    await detachRole()
    if (!arn) {
      log.alreadyDestroyed()
    } else {
      await iam.deleteInstanceProfileAsync({InstanceProfileName: name})
      log.destroyed()
    }
    await role.destroy()
  }

  return {
    create,
    destroy,
    getArn,
  }
}
