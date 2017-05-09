import logGroupFactory from '../logGroupFactory'

describe(__filename, function () {
  it('does the right thing', async function () {
    const logGroup = logGroupFactory({name: 'foo'})
    await logGroup.destroy()
    let arn
    arn = await logGroup.getArn()
    should.not.exist(arn)
    await logGroup.create()
    await logGroup.create() // is idempotent
    arn = await logGroup.getArn()
    arn.should.match(/^arn:aws:logs/)
    await logGroup.destroy()
    await logGroup.destroy() // is idempotent
  })
})
