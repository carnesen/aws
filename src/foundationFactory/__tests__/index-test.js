const foundationFactory = require('../index')

const foundation = foundationFactory()

describe(__filename, function () {
  it('does the right thing', async function () {
    await foundation.destroy()
    await foundation.create()
    await foundation.create() // is idempotent
    await foundation.destroy()
    await foundation.destroy() // is idempotent
  })
})
