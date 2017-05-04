import targetGroupFactory from '../targetGroupFactory'

describe(__filename, function () {
  it('does the right thing', async function () {
    const targetGroup = targetGroupFactory({name: 'foo'})
    await targetGroup.destroy()
    let arn
    arn = await targetGroup.getArn()
    should.not.exist(arn)
    await targetGroup.create()
    await targetGroup.create() // is idempotent
    arn = await targetGroup.getArn()
    should.exist(arn)
    await targetGroup.destroy()
    await targetGroup.destroy() // is idempotent
  })
})
