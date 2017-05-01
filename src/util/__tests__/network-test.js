import network from '../network'

describe(__filename, function () {
  it('does the right thing', async function () {
    const id = await network.getId()
    id.should.match(/^vpc-/)
    const subnetIds = await network.getSubnetIds()
    subnetIds.length.should.be.above(2)
    subnetIds.forEach(function (subnetId) {
      subnetId.should.match(/^subnet-/)
    })
  })
})
