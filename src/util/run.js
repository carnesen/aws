const {echo} = require('./logging')

module.exports = async function run (func) {
  console.log(func)
  try {
    const value = await func()
    if (value) {
      console.log(value) // eslint-disable-line no-console
    } else {
      echo('Success :)')
    }
    process.exit(0)
  } catch (err) {
    echo('Failed :(')
    echo(err.message)
    echo(err.stack)
    process.exit(1)
  }
}
