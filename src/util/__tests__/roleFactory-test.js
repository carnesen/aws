const roleFactory = require('../roleFactory')

describe(__filename, function () {
  it('does the right thing', async function () {
    const role = roleFactory({
      name: 'foo',
      trustedService: 'ec2.amazonaws.com',
      policyArn: 'arn:aws:iam::aws:policy/service-role/AmazonEC2ContainerServiceforEC2Role',
    })
    await role.destroy()
    let arn
    arn = await role.getArn()
    should.not.exist(arn)
    await role.create()
    await role.create() // is idempotent
    arn = await role.getArn()
    arn.should.match(/arn:aws:iam/)
    await role.destroy()
    await role.destroy() // is idempotent
  })
})
