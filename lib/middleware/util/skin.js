
// lets onion skin cli!!
//
module.exports = function(req, stack, abort){

  abort = abort || function(msg){
    console.log("\n")
    msg === null
      ? console.log("    Aborted".yellow)
      : console.log("    Aborted".yellow, "-", msg)
    console.log()
  }

  var that  = this
  var index = 0

  function next(err){
    var layer = stack[index++]
    if(!layer) return
    layer.call(that, req, next, abort)
  }

  return next()
}