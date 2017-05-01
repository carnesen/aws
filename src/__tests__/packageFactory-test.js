import path from 'path'

import packageFactory from '../packageFactory'

const packageDir = path.join(__dirname, 'test-package')

describe(__filename, function () {
  it('does the right thing', async function () {
    const pkg = packageFactory({packageDir})
    await pkg.destroyImage()
    let id
    id = await pkg.getImageId()
    should.not.exist(id)
    await pkg.buildImage()
    await pkg.buildImage() // is idempotent
    await pkg.buildImage({force: true})
    id = await pkg.getImageId()
    should.exist(id)
  })
})
