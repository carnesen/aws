'use strict'
const AWS = require('aws-sdk')
const Promise = require('bluebird')

const {REGION} = require('../constants')

AWS.config.update({region: REGION})

function createAwsSdkClient (serviceInterfaceName, apiVersion) {
  const ServiceInterface = AWS[serviceInterfaceName]
  const sdkClient = new ServiceInterface({apiVersion})
  Promise.promisifyAll(sdkClient)
  return sdkClient
}

module.exports = {
  acm: createAwsSdkClient('ACM', '2015-12-08'),
  cloudfront: createAwsSdkClient('CloudFront', '2017-03-25'),
  cloudwatchLogs: createAwsSdkClient('CloudWatchLogs', '2014-03-28'),
  ec2: createAwsSdkClient('EC2', '2016-11-15'),
  ecr: createAwsSdkClient('ECR', '2015-09-21'),
  ecs: createAwsSdkClient('ECS', '2014-11-13'),
  elbv2: createAwsSdkClient('ELBv2', '2015-12-01'),
  iam: createAwsSdkClient('IAM', '2010-05-08'),
  s3: createAwsSdkClient('S3', '2006-03-01'),
}
