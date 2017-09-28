'use strict'

const path = require('path')

const {DOMAIN_NAME, ENVIRONMENT_NAMES} = require('../constants')
const {acmCertificate, createLogger, execFile, getEnvironmentName, packageFactory} = require('../util')

const cloudfrontDistributionFactory = require('./cloudfrontDistributionFactory')
const s3BucketFactory = require('./s3BucketFactory')

module.exports = function websiteFactory (options = {}) {
  const {
    packageDir = process.cwd(),
    environmentName = getEnvironmentName(),
  } = options

  const environmentPostfix = environmentName === ENVIRONMENT_NAMES.prod
    ? ''
    : `-${environmentName}`

  const pkg = packageFactory({dir: packageDir})
  const name = `${pkg.name}${environmentPostfix}`
  const log = createLogger('Website', name)
  const localPath = path.join(packageDir, 'dist')

  const aliasDomainName = `${name}.${DOMAIN_NAME}`
  const s3Bucket = s3BucketFactory({name: aliasDomainName})

  const s3Origin = `${aliasDomainName}.s3.amazonaws.com`
  const distribution = cloudfrontDistributionFactory({
    s3Origin,
    aliasDomainName,
    getCertificateArn: acmCertificate.getArn,
  })

  async function create () {
    await s3Bucket.create()
    await s3Bucket.makeWorldReadable()
    if (pkg.scripts && pkg.scripts.build) {
      log('Running "npm run build" ...')
      await execFile('npm', ['run', 'build'], {cwd: packageDir})
    }
    await s3Bucket.sync({localPath})
    await distribution.create()
  }

  async function destroy () {
    await distribution.destroy()
    await s3Bucket.destroy()
  }

  return {
    create,
    destroy,
  }
}
