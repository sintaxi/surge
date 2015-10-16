
var middleware  = require('./middleware')
var skin        = require('./middleware/util/skin.js')
var help        = require('./middleware/help')
var read        = require("read")
var minimist    = require('minimist')


process.on('SIGINT', function() {
  console.log("\n")
  global.ponr == true
    ? console.log("    Disconnected".green, "-", "Past point of no return, completing in background.")
    : console.log("    Cancelled".yellow, "-", "Upload aborted, publish not initiated.")
  console.log()
  process.exit()
})

module.exports = function(config){
  config = config || {}

  var ep = config.endpoint
    ? config.endpoint
    : config.platform ? "http://surge." + config.platform : 'https://surge.surge.sh'

  var options = {
    alias: {
      p: 'project',
      d: 'domain',
      e: 'endpoint',
      b: 'build',
      a: 'add',
      r: 'remove'
    },
    boolean: 'b',
    default: { e: ep }
  }

  var surge = function(args){
    var argv = minimist(args, options)

    var req = {
      argv : argv,
      read : read
    }

    try {
      return skin(req, middleware, function(msg){
        console.log("\n")
        msg === null
          ? console.log("    Aborted".yellow)
          : console.log("    Aborted".yellow, "-", msg)
        console.log()
      })
    } catch(e) {
      console.log(e)
      console.log("    Invalid command.")
      console.log()
      help({ argv: argv }, new Function)
    }
  }

  return surge

}
