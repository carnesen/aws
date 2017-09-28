'use strict'
const {DOMAIN_NAME} = require('../constants')
const {acm} = require('./awsSdkClients')

async function getArn () {
  const {CertificateSummaryList} = await acm.listCertificatesAsync()
  const {CertificateArn} = CertificateSummaryList.find(function ({DomainName}) {
    return DomainName === `*.${DOMAIN_NAME}`
  })
  return CertificateArn
}

module.exports = {
  getArn,
}
