import endpointFactory from '../index'

describe(__filename, function () {
  it('does the right thing', async function () {
    const endpoint = endpointFactory()
    await endpoint.create()
    await endpoint.create() // is idempotent
    await endpoint.destroy()
    await endpoint.destroy() // is idempotent
  })
})
