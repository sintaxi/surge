var helpers = require("../../util/helpers")
var moniker = require("moniker")
var fs = require("fs")
var path = require("path")
var os = require("os")

module.exports = function(req, next, abort){
  var label = helpers.smart("pem file:").grey
  var pemPath
  var getPem = function(placeholder){
    req.read({
      prompt: label,
      default: placeholder,
      edit: true,
      terminal: req.configuration.terminal,
      output: req.configuration.output,
      input: req.configuration.input
    }, function(err, pem){
      if (pem === undefined) return abort("no PEM file provided".grey)
      if (pem === "") return getPem()
      var pemPath = path.resolve(pem || "")
      if (!fs.existsSync(pemPath)) return getPem(pem)
      req.pem = pemPath
      return next()
    })
  }

  var pem = req.argv["pem"]
  pemPath = path.resolve(pem || "")

  if (pem && fs.existsSync(pemPath)) {
    req.pem = pemPath
    //console.log(label, pemPath)
    return next()
  } else {
    return getPem()
  }

}
