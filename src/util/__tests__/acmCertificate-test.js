'use strict'
const acmCertificate = require('../acmCertificate')

describe(__filename, function () {
  it('does the right thing', async function () {
    const arn = await acmCertificate.getArn()
    arn.should.match(/^arn:aws:acm/)
  })
})
