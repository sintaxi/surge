
var instructions = require("./instructions.js")
var interactive  = require("./interactive.js")
var cutto        = require("./cutto.js")

module.exports = function(req, next){
  console.log(req.argv["_"])
  

  if (req.argv["_"].length === 0) {
    return instructions(req, next)
  } else if (req.argv["_"].length === 1) {
    return interactive(req, next)
  } else if (req.argv["_"].length === 2) {
    return cutto(req, next)
  }

}
