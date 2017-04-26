import repositoryFactory from '../repositoryFactory'

describe(__filename, function () {
  it('does the right thing', async function () {
    const repository = repositoryFactory()
    await repository.create()
    await repository.create() // is idempotent
    await repository.destroy()
    await repository.destroy() // is idempotent
  })
})
