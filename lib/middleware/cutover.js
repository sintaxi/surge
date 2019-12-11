
var helpers = require("../util/helpers")
var cutto = require("./cut/cutto")
var interactive  = require("./cut/interactive.js")

module.exports = function(req, next){
  
  if (req.argv.i){
    return interactive(req, next)
  } else {
    return cutto(req, next)  
  }
  
}