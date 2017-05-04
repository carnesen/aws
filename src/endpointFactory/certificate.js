import {DOMAIN_NAME} from '../constants'
import {acm} from '../util'

async function getArn () {
  const {CertificateSummaryList} = await acm.listCertificatesAsync()
  const {CertificateArn} = CertificateSummaryList.find(function ({DomainName}) {
    return DomainName === `*.${DOMAIN_NAME}`
  })
  return CertificateArn
}

export default {
  getArn,
}
