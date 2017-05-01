import AWS from 'aws-sdk'
import Promise from 'bluebird'

AWS.config.update({region: 'us-east-2'})

function createSdkClient (serviceInterfaceName, apiVersion) {
  const ServiceInterface = AWS[serviceInterfaceName]
  const sdkClient = new ServiceInterface({apiVersion})
  Promise.promisifyAll(sdkClient)
  return sdkClient
}

export const acm = createSdkClient('ACM', '2015-12-08')
export const ec2 = createSdkClient('EC2', '2016-11-15')
export const ecr = createSdkClient('ECR', '2015-09-21')
export const elbv2 = createSdkClient('ELBv2', '2015-12-01')
export const route53 = createSdkClient('Route53', '2013-04-01')
