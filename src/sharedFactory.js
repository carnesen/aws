import fs from 'fs'
import path from 'path'

import AWS from 'aws-sdk'
import Promise from 'bluebird'

import {echo} from './util'

const REGION = 'us-east-2'

AWS.config.update({region: REGION})

function getPackageName () {
  const packageContents = fs.readFileSync(path.join(process.cwd(), 'package.json'), {encoding: 'utf8'})
  return JSON.parse(packageContents).name
}

export default function sharedFactory (options = {}) {
  const {
    description,
    packageName = getPackageName(),
    region = REGION,
    serviceInterfaceName,
    getFullName = function ({packageName}) {
      return packageName
    }
  } = options

  const fullName = getFullName({packageName})
  const verboseName = `${description} "${fullName}"`
  const ServiceInterface = AWS[serviceInterfaceName]

  const sdkClient = new ServiceInterface()
  Promise.promisifyAll(sdkClient)

  function createLog (action) {
    return function () {
      echo(`${verboseName}: ${action}`)
    }
  }

  return {
    description,
    fullName,
    logCreating: createLog('creating ...'),
    logCreated: createLog('created'),
    logAlreadyCreated: createLog('already exists'),
    logIdempotentCreated: createLog('created if it didn\'t exist'),
    logDestroying: createLog('destroying ...'),
    logDestroyed: createLog('destroyed'),
    logAlreadyDestroyed: createLog('does not exist'),
    logIdempotentDestroyed: createLog('destroyed if it existed'),
    packageName,
    region,
    sdkClient
  }
}
