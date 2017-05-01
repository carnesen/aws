import listenerFactory, {PROTOCOLS} from '../listenerFactory'

describe(__filename, function () {
  it('does the right thing', async function () {
    const listener = listenerFactory({protocol: PROTOCOLS.HTTP})
    await listener.destroy()
    let arn
    arn = await listener.getArn()
    should.not.exist(arn)
    await listener.create()
    await listener.create() // is idempotent
    await listener.destroy()
    await listener.destroy() // is idempotent
  })
})
