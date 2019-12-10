var helpers = require("./util/helpers")
var cutto = require("./cut/cutto")
var interactive  = require("./cut/interactive.js")

module.exports = function(req, next){
  return interactive(req, next)
}