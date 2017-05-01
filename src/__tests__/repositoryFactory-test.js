import path from 'path'

import repositoryFactory from '../repositoryFactory'

const packageDir = path.join(__dirname, 'test-package')

describe(__filename, function () {
  it('does the right thing', async function () {
    const repository = repositoryFactory({packageDir})
    await repository.destroy()
    let uri
    uri = await repository.getUri()
    should.not.exist(uri)
    await repository.create()
    await repository.create() // is idempotent
    uri = await repository.getUri()
    uri.should.match(/ecr/)
    await repository.pushImage()
    await repository.pushImage()
    await repository.pushImage({force: true})
    await repository.destroy()
    await repository.destroy() // is idempotent
  })
})
