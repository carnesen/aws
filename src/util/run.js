'use strict'
const {echo} = require('./logging')

module.exports = async function run (func) {
  try {
    const value = await func()
    if (value) {
      echo(value) // eslint-disable-line no-console
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
