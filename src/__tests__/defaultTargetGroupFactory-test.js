import defaultTargetGroupFactory from '../defaultTargetGroupFactory'

describe(__filename, function () {
  it('does the right thing', async function () {
    const targetGroup = defaultTargetGroupFactory()
    await targetGroup.destroy()
    await targetGroup.create()
    await targetGroup.create() // is idempotent
    await targetGroup.destroy()
    await targetGroup.destroy() // is idempotent
  })
})
