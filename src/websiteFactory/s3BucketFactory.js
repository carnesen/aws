'use strict'

const childProcess = require('child_process')
const util = require('util')

const Promise = require('bluebird')

const {REGION} = require('../constants')
const {createLogger, s3} = require('../util')

const execFileAsync = util.promisify(childProcess.execFile)

module.exports = function s3BucketFactory ({name}) {
  const log = createLogger('S3 bucket', name)

  const uri = `s3://${name}`

  function runCli (...args) {
    return execFileAsync('aws', ['--region', REGION, 's3', ...args])
  }

  async function isExistent () {
    let returnValue = false
    try {
      await s3.headBucketAsync({
        Bucket: name,
      })
      returnValue = true
    } catch (ex) {
      if (ex.code !== 'NotFound') {
        throw ex
      }
    }
    return returnValue
  }

  async function create () {
    log.creating()
    const existent = await isExistent()
    if (existent) {
      log.alreadyCreated()
    } else {
      const params = {Bucket: name}
      // us-east-1 is the default region for s3 buckets and can't be specified explicitly
      if (REGION !== 'us-east-1') {
        Object.assign(params, {
          CreateBucketConfiguration: {
            LocationConstraint: REGION,
          },
        })
      }
      await s3.createBucketAsync(params)
      await s3.waitForAsync('bucketExists', {Bucket: name})
      log.created()
    }
  }

  async function destroy () {
    const existent = await isExistent()
    log.destroying()
    if (!existent) {
      log.alreadyDestroyed()
    } else {
      await runCli('rb', uri, '--force')
      await s3.waitForAsync('bucketNotExists', {Bucket: name})
      log.destroyed()
    }
  }

  async function makeWorldReadable () {
    const policyObject = {
      Version: '2012-10-17',
      Statement: [
        {
          Sid: 'PublicReadGetObject',
          Effect: 'Allow',
          Principal: '*',
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${name}/*`],
        },
      ],
    }

    await s3.putBucketPolicyAsync({
      Bucket: name,
      Policy: JSON.stringify(policyObject, null, 2),
    })
  }

  async function sync ({localPath}) {
    log(`Synchronizing ${localPath}`)
    await runCli('sync', '--only-show-errors', localPath, uri)
    await Promise.delay(1000) // wait for contents to settle
    log(`Synchronized ${localPath}`)
  }

  return {
    create,
    destroy,
    isExistent,
    makeWorldReadable,
    sync,
  }
}
