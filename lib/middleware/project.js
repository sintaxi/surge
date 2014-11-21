var path = require("path")
var fs   = require("fs")
var helpers = require("./util/helpers")

module.exports = function(req, next){
  console.log()
  var project = req.argv.project || req.argv["_"][0] || null
  req.project = path.resolve(project || "")

  var p = function(){

    helpers.prompt.get({
      name: "project",
      description: "       project path:",
      default: req.project,
      conform: function(val){
        return val == "./" || fs.existsSync(path.resolve(val))
      },
      before: function(val){
        process.stdout.clearLine()
        return val
      }
    }, function(err, result){
      result.project =
        result.project == "./"
        ? "./"
        : result.project

      var projPath = path.resolve(result.project)

      fs.exists(projPath, function(exists){
        if (exists) {
          req.project = projPath
          next()
        } else {
          helpers.log()
          helpers.log("    No such file or directory:", req.project.red)
          helpers.log()
        }
      })
    })
  }

  if (project !== null) {
    helpers.log("       project path:".grey, req.project)
    next()
  } else {
    p()
  }


}
