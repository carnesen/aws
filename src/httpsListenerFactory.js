import listenerFactory, {PROTOCOLS} from './listenerFactory'

import {getEnvironmentName} from './util'

export default function httpsListenerFactory (options = {}) {
  const {environmentName = getEnvironmentName()} = options
  return listenerFactory({environmentName, protocol: PROTOCOLS.HTTPS})
}
