'use strict'
const vpcNetwork = require('../vpcNetwork')

describe(__filename, function () {
  it('does the right thing', async function () {
    const id = await vpcNetwork.getId()
    id.should.match(/^vpc-/)
    const subnetIds = await vpcNetwork.getSubnetIds()
    subnetIds.length.should.be.above(2)
    subnetIds.forEach(function (subnetId) {
      subnetId.should.match(/^subnet-/)
    })
    const securityGroupId = await vpcNetwork.getSecurityGroupId()
    securityGroupId.should.match(/^sg-/)
    await vpcNetwork.openPorts()
  })
})
