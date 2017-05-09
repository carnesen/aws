import AWS from 'aws-sdk'
import Promise from 'bluebird'

import {REGION} from '../constants'

AWS.config.update({region: REGION})

function createSdkClient (serviceInterfaceName, apiVersion) {
  const ServiceInterface = AWS[serviceInterfaceName]
  const sdkClient = new ServiceInterface({apiVersion})
  Promise.promisifyAll(sdkClient)
  return sdkClient
}

export const acm = createSdkClient('ACM', '2015-12-08')
export const ec2 = createSdkClient('EC2', '2016-11-15')
export const ecr = createSdkClient('ECR', '2015-09-21')
export const ecs = createSdkClient('ECS', '2014-11-13')
export const elbv2 = createSdkClient('ELBv2', '2015-12-01')
export const iam = createSdkClient('IAM', '2010-05-08')
export const cwl = createSdkClient('CloudWatchLogs', '2014-03-28')
