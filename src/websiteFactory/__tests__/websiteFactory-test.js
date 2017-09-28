'use strict'
const path = require('path')
const websiteFactory = require('../index')

describe(__filename, function () {
  it.only('does the right thing', async function () {
    const website = websiteFactory({
      name: 'foo',
      localPath: path.join(__dirname, 'simple-website'),
    })
    await website.destroy()
    await website.create()
    await website.create() // is idempotent
    // await website.destroy()
    // await website.destroy() // is idempotent
  })
})
