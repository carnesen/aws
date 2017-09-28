'use strict'
const iamRoleFactory = require('../iamRoleFactory')

describe(__filename, function () {
  it('does the right thing', async function () {
    const iamRole = iamRoleFactory({
      name: 'foo',
      trustedService: 'ec2.amazonaws.com',
      policyArn: 'arn:aws:iam::aws:policy/service-role/AmazonEC2ContainerServiceforEC2Role',
    })
    await iamRole.destroy()
    let arn
    arn = await iamRole.getArn()
    should.not.exist(arn)
    await iamRole.create()
    await iamRole.create() // is idempotent
    arn = await iamRole.getArn()
    arn.should.match(/arn:aws:iam/)
    await iamRole.destroy()
    await iamRole.destroy() // is idempotent
  })
})
