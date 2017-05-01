import httpsListenerFactory from '../httpsListenerFactory'

describe(__filename, function () {
  it('does the right thing', async function () {
    const listener = httpsListenerFactory()
    await listener.destroy()
    let arn
    arn = await listener.getArn()
    should.not.exist(arn)
    await listener.create()
    await listener.create() // is idempotent
    arn = await listener.getArn()
    should.exist(arn)
    await listener.destroy()
    await listener.destroy() // is idempotent
  })
})
