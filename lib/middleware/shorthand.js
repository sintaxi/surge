var path = require("path")
var fs   = require("fs")

module.exports = function(req, next){
  req.argv.project = req.argv.p = req.argv.project || req.argv.p || req.argv["_"][0] || null
  req.argv.domain = req.argv.d = req.argv.domain || req.argv.d || req.argv["_"][1] || null
  next()
}