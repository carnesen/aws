#!/usr/bin/env node
'use strict'
const Koa = require('koa')

const app = new Koa()

app.use(async function (ctx){
  console.log(`Success!`)
  ctx.body = 'OK\n'
})

const PORT = 8000

console.log(`Starting on port ${PORT}`)

app.listen(PORT)
