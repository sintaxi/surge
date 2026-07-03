
// lets onion skin cli!!
//
var helpers = require("./helpers")

module.exports = function(req, stack, abort){

  abort = abort || function(msg){
    console.log("\n")
    msg == null
      ? console.log("   Aborted".yellow)
      : console.log("   Aborted".yellow + " - ".grey + msg)
    console.log()
    process.exit(1)
  }

  var that  = this
  var index = 0

  // calling next(err) from any middleware prints the error and exits
  // nonzero. accepts api errors ({ messages: [...] }), Error objects,
  // and plain strings.
  function fail(err){
    var messages = (err.messages && err.messages.length)
      ? err.messages
      : [err.message || err.toString()]
    helpers.space()
    messages.forEach(function(msg){
      helpers.trunc("Error".red + (" - " + msg).grey)
    })
    helpers.space()
    process.exit(1)
  }

  function next(err){
    if (err) return fail(err)
    var layer = stack[index++]
    if(!layer) return
    layer.call(that, req, next, abort)
  }

  return next()
}
