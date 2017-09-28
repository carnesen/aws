'use strict'

const fs = require('fs')
const path = require('path')

module.exports = function packageFactory ({dir}) {
  const jsonFile = path.join(dir, 'package.json')
  const {name, scripts} = JSON.parse(fs.readFileSync(jsonFile, {encoding: 'utf8'}))
  return {
    name,
    scripts,
  }
}
