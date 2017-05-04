import clusterFactory from '../clusterFactory'

describe(__filename, function () {
  it('does the right thing', async function () {
    const cluster = clusterFactory()
    await cluster.destroy()
    let arn
    arn = await cluster.getArn()
    should.not.exist(arn)
    await cluster.create()
    await cluster.create() // is idempotent
    arn = await cluster.getArn()
    arn.should.match(/^arn:aws:ecs/)
    await cluster.destroy()
    await cluster.destroy() // is idempotent
  })
})
