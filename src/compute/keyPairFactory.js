import path from 'path'

import expandHomeDir from 'expand-home-dir'
import keyMirror from 'keymirror'

const CODES = keyMirror({
  'InvalidKeyPair.NotFound': null,
})

import {createLogger, ec2, fs, getEnvironmentName} from '../util'

export default function keyPairFactory (options = {}) {
  const {environmentName = getEnvironmentName()} = options

  const fullName = environmentName.toLowerCase()

  const log = createLogger('EC2 key pair', fullName)

  async function getFingerprint () {
    let fingerprint
    try {
      const {KeyPairs} = await ec2.describeKeyPairsAsync({KeyNames: [fullName]})
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
      const {KeyMaterial} = await ec2.createKeyPairAsync({KeyName: fullName, DryRun: false})
      const homeDir = expandHomeDir('~')
      const sshDir = path.join(homeDir, '.ssh')
      await fs.ensureDirAsync(sshDir)
      const file = path.join(sshDir, `${fullName}.id_rsa`)
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
      await ec2.deleteKeyPairAsync({KeyName: fullName})
      log.destroyed()
    } else {
      log.alreadyDestroyed()
    }
  }

  return {
    create,
    destroy,
    fullName,
    getFingerprint,
  }
}
