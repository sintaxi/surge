var path = require("path")
var fs   = require("fs")

module.exports = function(req, next){
  req.argv.project = req.argv.project || req.argv["_"][0] || ""
  req.argv.project = path.resolve(req.argv.project)


  fs.exists(req.argv.project, function(exists){
    if (exists) {
      next()
    } else {
      console.log()
      console.log("    No such file or directory:", req.argv.project.red)
      console.log()
    }

  })

}
