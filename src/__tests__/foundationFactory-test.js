import foundationFactory from '../foundationFactory'

describe(__filename, function () {
  it('does the right thing', async function () {
    const foundation = foundationFactory()
    await foundation.destroy()
    await foundation.create()
  })
})
