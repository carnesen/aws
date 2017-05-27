'use strict'
const keyPairFactory = require('../keyPairFactory')

describe(__filename, function () {
  it('does the right thing', async function () {
    const keyPair = keyPairFactory({name: 'foo'})
    await keyPair.destroy()
    let fingerprint
    fingerprint = await keyPair.getFingerprint()
    should.not.exist(fingerprint)
    await keyPair.create()
    await keyPair.create() // is idempotent
    fingerprint = await keyPair.getFingerprint()
    fingerprint.should.match(/^..:..:../)
    await keyPair.destroy()
    await keyPair.destroy() // is idempotent
  })
})
