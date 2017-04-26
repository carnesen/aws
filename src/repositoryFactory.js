import sharedFactory from './sharedFactory'

export default function repositoryFactory (options = {}) {
  const shared = sharedFactory({
    ...options,
    description: 'ECS repository',
    serviceInterfaceName: 'ECR',
    getFullName ({packageName}) {
      return packageName.replace(/^@/, '')
    }
  })

  async function create () {
    shared.logCreating()
    try {
      await shared.sdkClient.createRepositoryAsync({repositoryName: shared.fullName})
      shared.logCreated()
    } catch (ex) {
      if (ex.code === 'RepositoryAlreadyExistsException') {
        shared.logAlreadyCreated()
      } else {
        throw ex
      }
    }
  }

  async function destroy () {
    try {
      shared.logDestroying()
      await shared.sdkClient.deleteRepositoryAsync({
        repositoryName: shared.fullName,
        force: true
      })
      shared.logDestroyed()
    } catch (ex) {
      if (ex.code === 'RepositoryNotFoundException') {
        shared.logAlreadyDestroyed()
      } else {
        throw ex
      }
    }
  }

  return {
    ...shared,
    create,
    destroy
  }
}
