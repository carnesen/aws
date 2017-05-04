// import instanceProfileFactory from '../instanceProfileFactory'
//
// describe(__filename, function () {
//   it('does the right thing', async function () {
//     const instanceProfile = instanceProfileFactory()
//     await instanceProfile.destroy()
//     let arn
//     arn = await instanceProfile.getArn()
//     should.not.exist(arn)
//     await instanceProfile.create()
//     await instanceProfile.create() // is idempotent
//     arn = await instanceProfile.getArn()
//     arn.should.match(/arn:aws:iam:/)
//     await instanceProfile.destroy()
//     await instanceProfile.destroy() // is idempotent
//   })
// })
