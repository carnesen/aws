'use strict'
const AWS = require('aws-sdk')
const Promise = require('bluebird')

const {REGION} = require('../constants')

AWS.config.update({region: REGION})

function createSdkClient (serviceInterfaceName, apiVersion) {
  const ServiceInterface = AWS[serviceInterfaceName]
  const sdkClient = new ServiceInterface({apiVersion})
  Promise.promisifyAll(sdkClient)
  return sdkClient
}

module.exports = {
  acm: createSdkClient('ACM', '2015-12-08'),
  ec2: createSdkClient('EC2', '2016-11-15'),
  ecr: createSdkClient('ECR', '2015-09-21'),
  ecs: createSdkClient('ECS', '2014-11-13'),
  elbv2: createSdkClient('ELBv2', '2015-12-01'),
  iam: createSdkClient('IAM', '2010-05-08'),
  cwl: createSdkClient('CloudWatchLogs', '2014-03-28'),
}
