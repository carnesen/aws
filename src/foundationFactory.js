import {clusterFactory, instanceFactory} from './compute'

import {getEnvironmentName} from './util'

export default function foundationFactory (options = {}) {
  const {environmentName = getEnvironmentName()} = options

  const cluster = clusterFactory({environmentName})
  const instance = instanceFactory({cluster, environmentName})

  async function create () {
    await cluster.create()
    await instance.create()
  }

  async function destroy () {

  }

  return {
    create,
    destroy,
  }
}
