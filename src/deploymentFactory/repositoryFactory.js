import childProcess from 'child_process'
import fs from 'fs'
import path from 'path'

import keyMirror from 'keymirror'
import Promise from 'bluebird'

import {createLogger, ecr} from '../util'

const CODES = keyMirror({
  ImageNotFoundException: null,
  RepositoryNotFoundException: null,
})

export default function repositoryFactory ({packageDir}) {
  const jsonFile = path.join(packageDir, 'package.json')
  const {name, scripts} = JSON.parse(fs.readFileSync(jsonFile, {encoding: 'utf8'}))

  const gitHash = childProcess.execFileSync(
    'git',
    ['rev-parse', '--short=10', 'HEAD'],
    {cwd: packageDir, encoding: 'utf8'}
  ).replace(/\n/g, '')

  const localImageName = `${name}:${gitHash}`

  const log = createLogger('package', name)

  async function docker (...args) {
    log(`Running "docker ${args.join(' ')}"`)
    const execFile = Promise.promisify(childProcess.execFile)
    const stdout = await execFile('docker', args, {cwd: packageDir})
    return stdout.replace(/\n$/, '')
  }

  async function getUri () {
    let uri
    try {
      const {repositories} = await ecr.describeRepositoriesAsync({
        repositoryNames: [name],
      })
      uri = repositories[0].repositoryUri
    } catch (ex) {
      if (ex.code !== CODES.RepositoryNotFoundException) {
        throw ex
      }
    }
    return uri
  }

  async function create () {
    const uri = await getUri()
    log.creating()
    if (uri) {
      log.alreadyCreated()
    } else {
      await ecr.createRepositoryAsync({repositoryName: name})
      log.created()
    }
  }

  async function destroy () {
    const uri = await getUri()
    log.destroying()
    if (!uri) {
      log.alreadyDestroyed()
    } else {
      await ecr.deleteRepositoryAsync({
        repositoryName: name,
        force: true,
      })
      log.destroyed()
    }
  }

  async function buildImage (options = {}) {
    const { force = false } = options
    log(`buildImage called with force=${force}`)

    const imageId = await docker('images', '--quiet', localImageName)

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
      if (scripts && scripts.build) {
        log('Running "npm run build" ...')
        await childProcess.execFile('npm', ['run', 'build'], {cwd: packageDir})
      }
      await docker('build', '--quiet', '--no-cache', '--tag', `${name}:${gitHash}`, '.')
    }
  }

  async function pushImage (options = {}) {
    const {force = false} = options
    log(`pushImage called with force=${force}`)
    let alreadyExists = false
    try {
      await ecr.describeImagesAsync({
        repositoryName: name,
        imageIds: [{imageTag: gitHash}],
      })
      alreadyExists = true
    } catch (ex) {
      if (ex.code !== CODES.ImageNotFoundException) {
        throw ex
      }
    }

    let shouldPush = true
    if (alreadyExists) {
      if (force) {
        log('Image already exists but "force" is truthy')
      } else {
        log('Image already exists')
        shouldPush = false
      }
    }

    const uri = await getUri()
    const remoteImageName = `${uri}:${gitHash}`

    if (shouldPush) {
      const {authorizationData} = await ecr.getAuthorizationTokenAsync()
      const {authorizationToken, proxyEndpoint} = authorizationData[0]
      const [username, password] = Buffer.from(authorizationToken, 'base64').toString('utf8').split(':')
      await docker('login', '--username', username, '--password', password, proxyEndpoint)
      await docker('tag', localImageName, remoteImageName)
      await docker('push', remoteImageName)
    }

    return remoteImageName
  }

  return {
    buildImage,
    create,
    destroy,
    getUri,
    name,
    pushImage,
  }
}
