var path = require("path")
var fs   = require("fs")
var helpers = require("./util/helpers")

module.exports = function(req, next){
  var project = req.argv.project || req.argv["_"][0] || ""
  req.project = path.resolve(project)

  var p = function(){
    helpers.prompt.get({
      name: "project",
      default: "current dir",
      conform: function(val){
        return val == "current dir" || fs.existsSync(path.resolve(val))
      }
    }, function(err, result){
      result.project =
        result.project == "current dir"
        ? "./"
        : result.project

      var projPath = path.resolve(result.project)

      fs.exists(projPath, function(exists){
        if (exists) {
          req.project = projPath
          helpers.log("project:".grey, req.project)
          next()
        } else {
          helpers.log()
          helpers.log("    No such file or directory:", req.project.red)
          helpers.log()
        }
      })
    })
  }


  p()


}
