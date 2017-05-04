import keyPairFactory from '../keyPairFactory'

describe(__filename, function () {
  it('does the right thing', async function () {
    const keyPair = keyPairFactory()
    await keyPair.create()
    await keyPair.create() // is idempotent
    await keyPair.destroy()
    await keyPair.destroy() // is idempotent
  })
})
