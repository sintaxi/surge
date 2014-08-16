#!/usr/bin/env node

var path    = require('path')
var yargs   = require('yargs')
var prompt  = require('prompt')
var m       = require('./middleware')
var skin    = require('./middleware/util/skin.js')

var argv =
  yargs
  .alias('d', 'domain')
  .default('domain', 'test.surge.sh')
  .alias('e', 'endpoint')
  .default('endpoint', 'surge.sh')
  .argv

var assetPath = path.resolve(argv["_"][0] || "")


var log = function(req, next){
  console.log(req)
  next()
}

// var info = function(req, next){
//   console.log()
//   console.log("          surge:", "v" + surge.pkg.version)
//   console.log("    local token:", !!surge.creds.get() ? "found" : "Not Found")
//   console.log("            dir:", assetPath)
//   console.log("         domain:", req.argv.domain)
//   console.log()
//   next()
// }

var mod = function(req, next){
  next()
}

// this is the flow
skin({ argv: argv, project: assetPath }, [
  m.creds,
  m.log,
  m.auth,
  m.deploy,
  process.exit
])

