var path = require("path")
var fs   = require("fs")
var helpers = require("./util/helpers")

module.exports = function(req, next, abort){
  var label = "       project path:".grey

  if (req.argv.project || req.argv["_"][0]) {
    req.project = path.resolve(req.argv.project || req.argv["_"][0] || "")

    fs.exists(req.project, function(exists){
      if (exists) {
        helpers.log("       project path:".grey, req.project)
        next()
      } else {
        helpers.log()
        helpers.log("    Aborted".yellow, "-", "No such file or directory.")
        helpers.log("   ", req.project.red)
        helpers.log()
      }
    })
  } else {
    var ask = function(suggestion){
      req.read({
        silent: false,
        prompt: label,
        default: suggestion,
        edit: true,
      }, function(err, projectPath){
        if (projectPath === undefined) return abort("publishing not initiated.")
        if (!fs.existsSync(path.resolve(projectPath))){
          console.log("                    ", "please enter valid project path...".grey)
          return ask(projectPath)
        } else {
          req.project = path.resolve(projectPath)
          return next()
        }
      })
    }

    var x = path.resolve("./")
    return ask(path.join(x, path.sep))
  }

}
