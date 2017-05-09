import {ecs, createLogger} from '../util'

export default function clusterFactory ({name}) {
  const log = createLogger('ECS cluster', name)

  async function getArn () {
    let arn
    const {clusters} = await ecs.describeClustersAsync({clusters: [name]})
    if (clusters[0]) {
      if (clusters[0].status === 'ACTIVE') {
        arn = clusters[0].clusterArn
      }
    }
    return arn
  }

  async function create () {
    const arn = await getArn()
    log.creating()
    if (arn) {
      log.alreadyCreated()
    } else {
      // http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/ECS.html#createCluster-property
      await ecs.createClusterAsync({clusterName: name})
      log.created()
    }
  }

  async function destroy () {
    const arn = await getArn()
    log.destroying()
    if (!arn) {
      log.alreadyDestroyed()
    } else {
      // http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/ECS.html#deleteCluster-property
      await ecs.deleteClusterAsync({cluster: name})
    }
  }

  return {
    create,
    destroy,
    getArn,
    name,
  }
}
