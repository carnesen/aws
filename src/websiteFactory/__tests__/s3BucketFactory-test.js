'use strict'
const path = require('path')
const s3BucketFactory = require('../s3BucketFactory')

describe(__filename, function () {
  it('does the right thing', async function () {
    const s3bucket = s3BucketFactory({
      name: 'carnesen-test-bucket',
    })
    let existent
    await s3bucket.destroy()
    existent = await s3bucket.isExistent()
    existent.should.equal(false)
    await s3bucket.create()
    await s3bucket.create() // is idempotent
    existent = await s3bucket.isExistent()
    existent.should.equal(true)
    await s3bucket.sync({localPath: path.join(__dirname, 'simple-website')})
    await s3bucket.destroy()
    await s3bucket.destroy() // is idempotent
  })
})
