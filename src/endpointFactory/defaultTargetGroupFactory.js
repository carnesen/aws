import targetGroupFactory from './targetGroupFactory'

import {getEnvironmentName} from '../util'

export default function defaultTargetGroupFactory (options = {}) {
  const {environmentName = getEnvironmentName()} = options
  return targetGroupFactory({environmentName, name: 'default'})
}
