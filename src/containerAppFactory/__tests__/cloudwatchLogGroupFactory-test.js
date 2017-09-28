'use strict'
const cloudwatchLogGroupFactory = require('../cloudwatchLogGroupFactory')

describe(__filename, function () {
  it('does the right thing', async function () {
    const cloudwatchLogGroup = cloudwatchLogGroupFactory({name: 'foo'})
    await cloudwatchLogGroup.destroy()
    let arn
    arn = await cloudwatchLogGroup.getArn()
    should.not.exist(arn)
    await cloudwatchLogGroup.create()
    await cloudwatchLogGroup.create() // is idempotent
    arn = await cloudwatchLogGroup.getArn()
    arn.should.match(/^arn:aws:logs/)
    await cloudwatchLogGroup.destroy()
    await cloudwatchLogGroup.destroy() // is idempotent
  })
})
