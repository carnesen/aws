import instanceFactory from '../instanceFactory'

const cluster = {fullName: 'foo'}

describe(__filename, function () {
  it('does the right thing', async function () {
    const instance = instanceFactory({cluster})
    await instance.destroy()
    let id
    id = await instance.getId()
    should.not.exist(id)
    await instance.create()
    await instance.create() // is idempotent
    id = await instance.getId()
    id.should.match(/^i-/)
    await instance.destroy()
    await instance.destroy() // is idempotent
  })
})
