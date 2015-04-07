var middleware  = require('./middleware')
var skin        = require('./middleware/util/skin.js')

module.exports = function(req){
  return skin(req, middleware, function(msg){
    console.log("\n")
    console.log("    Aported".yellow)
    console.log()
  })
}
