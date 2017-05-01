import childProcess from 'child_process'
import fs from 'fs'
import path from 'path'

import Promise from 'bluebird'

import {ENVIRONMENT_NAMES} from './constants'

import {createLogger, getEnvironmentName, getPackageDir} from './util'

export default function packageFactory (options = {}) {
  const {environmentName = getEnvironmentName(), packageDir = getPackageDir()} = options

  const jsonFile = path.join(packageDir, 'package.json')
  const {name, scripts} = JSON.parse(fs.readFileSync(jsonFile, {encoding: 'utf8'}))

  const gitHash = childProcess.execFileSync(
    'git',
    ['rev-parse', '--short=10', 'HEAD'],
    {cwd: packageDir, encoding: 'utf8'}
  ).replace(/\n/g, '')

  const fullName = name.split('/').slice(-1)[0]
  const environmentPrefix = environmentName === ENVIRONMENT_NAMES.DEVOPS ? 'devops' : 'prod'
  const repositoryName = `${environmentPrefix}/${fullName}`

  const imageName = `${repositoryName}:${gitHash}`

  const log = createLogger('package', fullName)

  async function docker (...args) {
    log(`Running "docker ${args.join(' ')}"`)
    const execFile = Promise.promisify(childProcess.execFile)
    const stdout = await execFile('docker', args, {cwd: packageDir})
    return stdout.replace(/\n$/, '')
  }

  async function getImageId () {
    let id
    const stdout = await docker('images', '--quiet', imageName)
    if (stdout) {
      id = stdout
    }
    return id
  }

  async function destroyImage () {
    try {
      await docker('rmi', '--force', imageName)
    } catch (ex) {
      if (!ex.message.includes('No such image')) {
        throw ex
      }
    }
  }

  async function build () {
    if (scripts && scripts.build) {
      log('Running "npm run build" ...')
      await childProcess.execFile('npm', ['run', 'build'], {
        cwd: packageDir, env: {NODE_ENV: 'production'},
      })
    }
  }

  async function buildImage (options = {}) {
    const {force = false} = options
    log(`pushImage called with force=${force}`)

    const imageId = await getImageId()

    let shouldBuild = true
    if (imageId) {
      if (force) {
        log('Image already exists but "force" is truthy')
      } else {
        log('Image already exists')
        shouldBuild = false
      }
    }

    if (shouldBuild) {
      await build()
      await docker('build', '--quiet', '--no-cache', '--tag', `${repositoryName}:${gitHash}`, '.')
    }

    return imageName
  }

  return {
    buildImage,
    destroyImage,
    docker,
    getImageId,
    gitHash,
    fullName,
    repositoryName,
  }
}
