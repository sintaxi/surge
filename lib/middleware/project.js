var path = require("path")
var fs   = require("fs")

module.exports = function(req, next){
  var project = req.argv.project || req.argv["_"][0] || ""
  req.project = path.resolve(project)

  fs.exists(req.project, function(exists){
    if (exists) {
      next()
    } else {
      console.log()
      console.log("    No such file or directory:", req.project.red)
      console.log()
    }

  })

}
