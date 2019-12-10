var path = require("path")
var fs   = require("fs")

module.exports = function(req, next){
  req.project = req.argv.project || req.argv.p || req.argv["_"][0] || null
  req.domain  = req.argv.domain  || req.argv.d || req.argv["_"][1] || null
  next()
}