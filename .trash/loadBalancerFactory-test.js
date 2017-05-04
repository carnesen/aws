import loadBalancerFactory from '../loadBalancerFactory'

describe(__filename, function () {
  it('does the right thing', async function () {
    const loadBalancer = loadBalancerFactory()
    await loadBalancer.destroy()
    await loadBalancer.create()
    await loadBalancer.create() // is idempotent
    await loadBalancer.destroy()
    await loadBalancer.destroy() // is idempotent
  })
})
