var path = require("path")
var fs   = require("fs")
var helpers = require("./util/helpers")

module.exports = function(req, next){
  console.log("project--")
  var label = "       project path:".grey

  if (req.argv.project || req.argv["_"][0]) {
    req.project = path.resolve(req.argv.project || req.argv["_"][0] || null)

    fs.exists(req.project, function(exists){
      if (exists) {
        //req.project = req.project
        helpers.log("       project path:".grey, req.project)
        next()
      } else {
        helpers.log()
        helpers.log("    No such file or directory:", req.project.red)
        helpers.log()
      }
    })
  } else {
    var p = function(suggestion){
      req.read({
        silent: false,
        prompt: label,
        default: suggestion,
        edit: true,
      }, function(err, projectPath){
        if (projectPath === undefined) throw new Error('Abort')
        if (!fs.existsSync(path.resolve(projectPath))){
          console.log("            invalid:".yellow, "please enter project path.".grey)
          return ask(projectPath)
        } else {
          req.project = path.resolve(projectPath)
          return next()
        }
      })
    }

    var x = path.resolve("./", fs.sep)
    x = "/foobar/"
    return p(x)
  }

}
