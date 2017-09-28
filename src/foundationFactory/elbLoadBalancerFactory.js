'use strict'
const keyMirror = require('keymirror')

const {createLogger, elbv2, vpcNetwork} = require('../util')

const CODES = keyMirror({
  LoadBalancerNotFound: null,
})

module.exports = function loadBalancerFactory ({name}) {
  const log = createLogger('Application load balancer', name)

  // http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/ELBv2.html#describeLoadBalancers-property
  async function describe () {
    let description
    try {
      const {LoadBalancers} = await elbv2.describeLoadBalancersAsync({Names: [name]})
      description = LoadBalancers[0]
    } catch (ex) {
      if (ex.code !== CODES.LoadBalancerNotFound) {
        throw ex
      }
    }
    return description
  }

  async function getArn () {
    let arn
    const description = await describe()
    if (description) {
      arn = description.LoadBalancerArn
    }
    return arn
  }

  async function create () {
    log.creating()
    const description = await describe()
    if (description) {
      log.alreadyCreated()
    } else {
      const subnetIds = await vpcNetwork.getSubnetIds()
      await elbv2.createLoadBalancerAsync({
        Name: name,
        Subnets: subnetIds,
        Scheme: 'internet-facing',
        IpAddressType: 'ipv4',
      })
      log.created()
    }
  }

  // Note: Deleting the load balancer also deletes all attached listeners
  async function destroy () {
    log.destroying()
    const arn = await getArn()
    if (arn) {
      await elbv2.deleteLoadBalancerAsync({LoadBalancerArn: arn})
      const intervalSeconds = 6
      log(`Waiting ${intervalSeconds} seconds for load balancer to be fully destroyed`)
      await Promise.delay(intervalSeconds * 1000)
      log.destroyed()
    } else {
      log.alreadyDestroyed()
    }
  }

  return {
    create,
    destroy,
    name,
    getArn,
  }
}
