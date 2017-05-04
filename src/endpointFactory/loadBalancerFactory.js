import Promise from 'bluebird'
import keyMirror from 'keymirror'

import network from '../network'
import {createLogger, elbv2, getEnvironmentName} from '../util'

const CODES = keyMirror({
  LoadBalancerNotFound: null,
})

export default function loadBalancerFactory (options = {}) {
  const {environmentName = getEnvironmentName()} = options

  const fullName = environmentName.toLowerCase()

  const log = createLogger('Application load balancer', fullName)

  // http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/ELBv2.html#describeLoadBalancers-property
  async function describe () {
    let description
    try {
      const {LoadBalancers} = await elbv2.describeLoadBalancersAsync({Names: [fullName]})
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
      const subnetIds = await network.getSubnetIds()
      await elbv2.createLoadBalancerAsync({
        Name: fullName,
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
      await Promise.delay(3500)
      log.destroyed()
    } else {
      log.alreadyDestroyed()
    }
  }

  return {
    create,
    destroy,
    fullName,
    getArn,
  }
}
