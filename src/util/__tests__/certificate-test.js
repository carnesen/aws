'use strict'
const certificate = require('../certificate')

describe(__filename, function () {
  it('does the right thing', async function () {
    const arn = await certificate.getArn()
    console.log(arn)
    arn.should.match(/^arn:aws:acm/)
  })
})
