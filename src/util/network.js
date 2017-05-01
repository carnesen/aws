import {ec2} from './sdkClients'

async function getId () {
  const {Vpcs} = await ec2.describeVpcsAsync({
    DryRun: false,
    Filters: [{Name: 'isDefault', Values: ['true']}],
  })
  return Vpcs[0].VpcId
}

async function getSubnetIds () {
  const id = await getId()
  const {Subnets} = await ec2.describeSubnetsAsync({
    Filters: [
      {
        Name: 'vpc-id',
        Values: [id],
      },
    ],
  })
  return Subnets.map(Subnet => Subnet.SubnetId)
}

export default {
  getId,
  getSubnetIds,
}
