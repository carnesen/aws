import instanceProfileFactory from './instanceProfileFactory'
import keyPairFactory from './keyPairFactory'
import network from '../network'
import roleFactory from './roleFactory'

import {createLogger, ec2, encodeBase64, getEnvironmentName} from '../util'

export default function instanceFactory (options = {}) {
  const {cluster, environmentName = getEnvironmentName()} = options

  const fullName = environmentName.toLowerCase()

  const instanceProfile = instanceProfileFactory({environmentName})
  const keyPair = keyPairFactory({environmentName})
  const role = roleFactory({
    environmentName,
    name: 'instance',
    trustedService: 'ec2.amazonaws.com',
    policyArn: 'arn:aws:iam::aws:policy/service-role/AmazonEC2ContainerServiceforEC2Role',
  })

  const log = createLogger('EC2 instance', fullName)

  async function getId () {
    let id
    // http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/EC2.html#describeInstances-property
    const {Reservations} = await ec2.describeInstancesAsync({
      Filters: [{Name: 'tag:Name', Values: [fullName]}]
    })
    for (let reservation of Reservations) {
      const {Instances} = reservation
      const filteredInstances = Instances.filter(function ({State}) {
        return State.Name === 'running' || State.Name === 'pending'
      })
      if (filteredInstances[0]) {
        id = filteredInstances[0].InstanceId
      }
    }
    return id
  }

  async function create () {
    const id = await getId()
    log.creating()
    if (id) {
      log.alreadyCreated()
    } else {
      await keyPair.create()
      await role.create()
      await instanceProfile.create()
      await instanceProfile.attachRole(role.fullName)
      const instanceProfileArn = await instanceProfile.getArn()
      const securityGroupId = await network.getSecurityGroupId()
      await ec2.runInstancesAsync({
        ImageId: 'ami-62745007',
        MaxCount: 1,
        MinCount: 1,
        BlockDeviceMappings: [
          {
            DeviceName: '/dev/xvda',
            Ebs: {
              DeleteOnTermination: true,
              VolumeSize: 8,
              VolumeType: 'gp2',
            }
          },
          {
            DeviceName: '/dev/xvdcz',
            Ebs: {
              DeleteOnTermination: true,
              VolumeSize: 22,
              VolumeType: 'gp2',
            }
          },
        ],
        DryRun: false,
        IamInstanceProfile: {Arn: instanceProfileArn},
        InstanceInitiatedShutdownBehavior: 'terminate',
        InstanceType: 't2.micro',
        KeyName: keyPair.fullName,
        Monitoring: {Enabled: false},
        SecurityGroupIds: [securityGroupId],
        TagSpecifications: [{
          ResourceType: 'instance',
          Tags: [{Key: 'Name', Value: fullName}]
        }],
        UserData: encodeBase64(`#!/bin/bash\necho ECS_CLUSTER=${cluster.fullName} >> /etc/ecs/ecs.config`)
      })
      log.created()
    }
  }

  async function destroy () {
    const id = await getId()
    log.destroying()
    if (!id) {
      log.alreadyDestroyed()
    } else {
      await ec2.terminateInstancesAsync({InstanceIds:[id]})
      log.destroyed()
    }
  }

  return {
    create,
    destroy,
    getId,
  }
}
