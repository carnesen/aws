'use strict'
const ec2KeyPairFactory = require('../ec2KeyPairFactory')

describe(__filename, function () {
  it('does the right thing', async function () {
    const ec2KeyPair = ec2KeyPairFactory({name: 'foo'})
    await ec2KeyPair.destroy()
    let fingerprint
    fingerprint = await ec2KeyPair.getFingerprint()
    should.not.exist(fingerprint)
    await ec2KeyPair.create()
    await ec2KeyPair.create() // is idempotent
    fingerprint = await ec2KeyPair.getFingerprint()
    fingerprint.should.match(/^..:..:../)
    await ec2KeyPair.destroy()
    await ec2KeyPair.destroy() // is idempotent
  })
})
