'use strict'
const path = require('path')

const expandHomeDir = require('expand-home-dir')
const keyMirror = require('keymirror')

const {createLogger, ec2, fs} = require('../util')

const CODES = keyMirror({
  'InvalidKeyPair.NotFound': null,
})

module.exports = function keyPairFactory ({name}) {
  const log = createLogger('EC2 key pair', name)

  async function getFingerprint () {
    let fingerprint
    try {
      const {KeyPairs} = await ec2.describeKeyPairsAsync({KeyNames: [name]})
      fingerprint = KeyPairs[0].KeyFingerprint
    } catch (ex) {
      if (ex.code !== CODES['InvalidKeyPair.NotFound']) {
        throw ex
      }
    }
    return fingerprint
  }

  async function create () {
    const fingerprint = await getFingerprint()
    log.creating()
    if (!fingerprint) {
      const {KeyMaterial} = await ec2.createKeyPairAsync({KeyName: name, DryRun: false})
      const homeDir = expandHomeDir('~')
      const sshDir = path.join(homeDir, '.ssh')
      await fs.ensureDirAsync(sshDir)
      const file = path.join(sshDir, `${name}.id_rsa`)
      await fs.removeAsync(file)
      await fs.writeFileAsync(file, KeyMaterial, {mode: 600})
      log.created()
    } else {
      log.alreadyCreated()
    }
  }

  async function destroy () {
    const fingerprint = await getFingerprint()
    log.destroying()
    if (fingerprint) {
      await ec2.deleteKeyPairAsync({KeyName: name})
      log.destroyed()
    } else {
      log.alreadyDestroyed()
    }
  }

  return {
    create,
    destroy,
    getFingerprint,
    name,
  }
}
