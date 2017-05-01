import keyMirror from 'keymirror'

import packageFactory from './packageFactory'
import {createLogger, ecr, getEnvironmentName, getPackageDir} from './util'

const CODES = keyMirror({
  ImageNotFoundException: null,
  RepositoryAlreadyExistsException: null,
  RepositoryNotFoundException: null,
})

export default function repositoryFactory (options = {}) {
  const {environmentName = getEnvironmentName(), packageDir = getPackageDir()} = options

  const pkg = packageFactory({environmentName, packageDir})
  const fullName = pkg.repositoryName

  const log = createLogger('ECS repository', fullName)

  async function getUri () {
    let uri
    try {
      const {repositories} = await ecr.describeRepositoriesAsync({
        repositoryNames: [fullName],
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
    log.creating()
    try {
      await ecr.createRepositoryAsync({repositoryName: fullName})
      log.created()
    } catch (ex) {
      if (ex.code === CODES.RepositoryAlreadyExistsException) {
        log.alreadyCreated()
      } else {
        throw ex
      }
    }
  }

  async function destroy () {
    try {
      log.destroying()
      await ecr.deleteRepositoryAsync({
        repositoryName: fullName,
        force: true,
      })
      log.destroyed()
    } catch (ex) {
      if (ex.code === CODES.RepositoryNotFoundException) {
        log.alreadyDestroyed()
      } else {
        throw ex
      }
    }
  }

  async function pushImage (options = {}) {
    const {force = false} = options
    log(`pushImage called with force=${force}`)
    let alreadyExists = false
    try {
      await ecr.describeImagesAsync({
        repositoryName: fullName,
        imageIds: [{imageTag: pkg.gitHash}],
      })
      alreadyExists = true
    } catch (ex) {
      if (ex.code !== CODES.ImageNotFoundException) {
        throw ex
      }
    }

    let shouldBuild = true
    if (alreadyExists) {
      if (force) {
        log('Image already exists but "force" is truthy')
      } else {
        log('Image already exists')
        shouldBuild = false
      }
    }

    const uri = await getUri()
    const imageName = `${uri}:${pkg.gitHash}`

    if (shouldBuild) {
      const localImageName = await pkg.buildImage({force})
      const {authorizationData} = await ecr.getAuthorizationTokenAsync()
      const {authorizationToken, proxyEndpoint} = authorizationData[0]
      const [username, password] = Buffer.from(authorizationToken, 'base64').toString('utf8').split(':')
      await pkg.docker('login', '--username', username, '--password', password, proxyEndpoint)
      await pkg.docker('tag', localImageName, imageName)
      await pkg.docker('push', imageName)
    }
    return imageName
  }

  return {
    create,
    destroy,
    getUri,
    pushImage,
  }
}
