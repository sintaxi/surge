
var moniker = require("moniker")
var fs      = require("fs")
var path    = require("path")
var os      = require("os")
var helpers = require("./util/helpers")

exports.suggestDomainFromCname = function(req, next){
  if (!req.domain && !req.suggestedDomain) {
    try {
      var cname = fs.readFileSync(path.join(req.project, "CNAME")).toString()
      console.log("suggestDomainFromCname")
      req.suggestedDomain = cname.split(os.EOL)[0].trim()
      console.log("suggestDomainFromCname")
    } catch(e) {}
  }

  return next()
}

exports.setDomainFromCname = function(req, next){
  if (!req.domain && !req.suggestedDomain) {
    try {
      var cname = fs.readFileSync(path.join(req.project, "CNAME")).toString()
      req.domain = cname.split(os.EOL)[0].trim()
    } catch(e) {}
  }
  return next()
}

exports.suggestDomainFromGenerator = function(req, next){
  if (!req.domain && !req.suggestedDomain) {
    req.suggestedDomain = [moniker.choose(), req.config.platform].join(".")
  }
  return next()
}

exports.setDomainFromArgs = function(req, next){
  if (!req.domain && req.argv._[0]) {
    req.domain = req.argv._[0]
  }
  return next()
}



