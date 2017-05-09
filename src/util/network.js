import keyMirror from 'keymirror'

import createLogger from './createLogger'
import {ec2} from './sdkClients'

const log = createLogger('VPC network', 'default')

const CODES = keyMirror({
  'InvalidPermission.Duplicate': null,
})

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

async function getSecurityGroupId () {
  const networkId = await getId()
  const {SecurityGroups} = await ec2.describeSecurityGroupsAsync({
    DryRun: false,
    Filters: [
      {
        Name: 'vpc-id',
        Values: [networkId],
      },
      {
        Name: 'group-name',
        Values: ['default'],
      },
    ],
  })
  return SecurityGroups[0].GroupId
}

async function openPort (portNumber) {
  const securityGroupId = await getSecurityGroupId()
  log(`Opening port ${portNumber}`)
  try {
    await ec2.authorizeSecurityGroupIngressAsync({
      GroupId: securityGroupId,
      DryRun: false,
      IpPermissions: [
        {
          IpProtocol: 'tcp',
          FromPort: portNumber,
          ToPort: portNumber,
          IpRanges: [{CidrIp: '0.0.0.0/0'}],
        },
      ],
    })
  } catch (ex) {
    if (ex.code !== CODES['InvalidPermission.Duplicate']) {
      throw ex
    }
  }
}

async function openPorts () {
  await openPort(22) // ssh
  await openPort(80) // http
  await openPort(443) // https
}

export default {
  getId,
  getSecurityGroupId,
  getSubnetIds,
  openPorts,
}
