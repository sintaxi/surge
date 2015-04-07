var middleware  = require('./middleware')
var skin        = require('./middleware/util/skin.js')

module.exports = function(req){
  return skin(req, middleware, function(msg){
    console.log("\n")
    msg === null
      ? console.log("    Aborted".yellow)
      : console.log("    Aborted".yellow, "-", msg)
    console.log()
  })
}
