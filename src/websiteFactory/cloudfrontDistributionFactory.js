'use strict'

const {cloudfront, createLogger} = require('../util')

module.exports = function distributionFactory (options) {
  const {
    s3Origin,
    aliasDomainName,
    getCertificateArn,
  } = options

  const log = createLogger('CloudFront distribution for origin', s3Origin)

  async function describe () {
    let description
    const {DistributionList} = await cloudfront.listDistributionsAsync()
    const {Items} = DistributionList
    const Item = Items.find(function (Item) {
      return Item.Origins.Items.find(function (originItem) {
        return originItem.DomainName === s3Origin
      })
    })
    if (Item) {
      description = Item
    }
    return description
  }

  async function getDomainName () {
    let domainName
    const description = await describe()
    if (description) {
      domainName = description.DomainName
    }
    return domainName
  }

  const DefaultCacheBehavior = {
    ForwardedValues: {
      Cookies: {
        Forward: 'none',
      },
      QueryString: true,
    },
    TargetOriginId: s3Origin,
    MinTTL: 0,
    TrustedSigners: {
      Enabled: false,
      Quantity: 0,
    },
    ViewerProtocolPolicy: 'redirect-to-https',
    AllowedMethods: {
      Quantity: 2,
      Items: ['GET', 'HEAD'],
      CachedMethods: {
        Quantity: 2,
        Items: ['GET', 'HEAD'],
      },
    },
    Compress: true,
    DefaultTTL: 86400,
  }

  async function create () {
    const certificateArn = await getCertificateArn()
    const DistributionConfig = {
      CallerReference: Date.now().toString(),
      Comment: aliasDomainName,
      DefaultCacheBehavior,
      Enabled: true,
      Origins: {
        Quantity: 1,
        Items: [{
          Id: s3Origin,
          DomainName: s3Origin,
          S3OriginConfig: {
            OriginAccessIdentity: '',
          },
        }],
      },
      Aliases: {
        Quantity: 1,
        Items: [aliasDomainName],
      },
      DefaultRootObject: 'index.html',
      HttpVersion: 'http2',
      IsIPV6Enabled: true,
      PriceClass: 'PriceClass_100',
      ViewerCertificate: {
        ACMCertificateArn: certificateArn,
        MinimumProtocolVersion: 'TLSv1',
        SSLSupportMethod: 'sni-only',
      },
      CustomErrorResponses: {
        Quantity: 1,
        Items: [
          {
            ErrorCode: 404,
            ResponsePagePath: '/index.html',
            ResponseCode: '200',
          },
        ],
      },
    }
    const domainName = await getDomainName()
    log.creating()
    if (domainName) {
      log.alreadyCreated()
    } else {
      await cloudfront.createDistributionAsync({DistributionConfig})
    }
  }

  async function destroy () {
    // TODO: Implement this
    log('Destroy method is not yet implemented!')
  }

  return {
    create,
    destroy,
    getDomainName,
  }
}
