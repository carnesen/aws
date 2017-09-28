'use strict'
const path = require('path')

const ecsRepositoryFactory = require('../ecsRepositoryFactory')

const packageDir = path.join(__dirname, 'test-package')

describe(__filename, function () {
  it('does the right thing', async function () {
    const ecsRepository = ecsRepositoryFactory({environmentName: 'foo', packageDir})
    await ecsRepository.destroy()
    let uri
    uri = await ecsRepository.getUri()
    should.not.exist(uri)
    await ecsRepository.create()
    await ecsRepository.create() // is idempotent
    uri = await ecsRepository.getUri()
    uri.should.match(/ecr/)
    await ecsRepository.buildImage({force: true})
    await ecsRepository.pushImage()
    await ecsRepository.pushImage()
    await ecsRepository.pushImage({force: true})
    await ecsRepository.destroy()
    await ecsRepository.destroy() // is idempotent
  })
})
