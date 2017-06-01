'use strict'
const certificate = require('../certificate')

describe(__filename, function () {
  it('does the right thing', async function () {
    const arn = await certificate.getArn()
    arn.should.match(/^arn:aws:acm/)
  })
})
