'use strict'
const ec2InstanceProfileFactory = require('../ec2InstanceProfileFactory')

describe(__filename, function () {
  it('does the right thing', async function () {
    const ec2InstanceProfile = ec2InstanceProfileFactory({name: 'foo'})
    await ec2InstanceProfile.destroy()
    let arn
    arn = await ec2InstanceProfile.getArn()
    should.not.exist(arn)
    await ec2InstanceProfile.create()
    await ec2InstanceProfile.create() // is idempotent
    arn = await ec2InstanceProfile.getArn()
    arn.should.match(/^arn:aws:iam/)
    await ec2InstanceProfile.destroy()
    await ec2InstanceProfile.destroy() // is idempotent
  })
})
