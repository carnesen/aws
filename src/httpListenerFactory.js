import listenerFactory, {PROTOCOLS} from './listenerFactory'

import {getEnvironmentName} from './util'

export default function httpListenerFactory (options = {}) {
  const {environmentName = getEnvironmentName()} = options
  return listenerFactory({environmentName, protocol: PROTOCOLS.HTTP})
}
