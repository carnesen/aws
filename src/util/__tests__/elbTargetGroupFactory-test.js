'use strict'
const elbTargetGroupFactory = require('../elbTargetGroupFactory')

describe(__filename, function () {
  it('does the right thing', async function () {
    const elbTargetGroup = elbTargetGroupFactory({name: 'foo'})
    await elbTargetGroup.destroy()
    let arn
    arn = await elbTargetGroup.getArn()
    should.not.exist(arn)
    await elbTargetGroup.create()
    await elbTargetGroup.create() // is idempotent
    arn = await elbTargetGroup.getArn()
    should.exist(arn)
    await elbTargetGroup.destroy()
    await elbTargetGroup.destroy() // is idempotent
  })
})
