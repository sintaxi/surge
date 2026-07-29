var path = require("path")
var fs   = require("fs")
var helpers = require("../../util/helpers")
var discovery = require("./discovery")

module.exports = function(req, next, abort){

  if (req.project || req.argv.project || req.argv["_"][0]) {
    req.project = req.project || path.resolve(req.argv.project || req.argv["_"][0] || "")

    fs.exists(req.project, function(exists){
      if (exists) {
        helpers.log(helpers.smart("project:").grey + " " + req.project)
        next()
      } else {
        helpers.space()
        helpers.trunc("Aborted".yellow + " - No such file or directory: ".grey + req.project.red)
        helpers.space()
        process.exit(1)
      }
    })
  } else {
    var ask = function(suggestion){
      req.read({
        silent: false,
        prompt: helpers.smart("project:").grey,
        default: suggestion,
        edit: true,
        terminal: req.configuration.terminal,
        output: req.configuration.output,
        input: req.configuration.input
      }, function(err, projectPath){
        if (projectPath === undefined) {
          return abort("Publishing not initiated.".grey)
        }
          
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

    // a cwd carrying a CNAME is the target - surge wrote that file into
    // this exact directory on its last publish, so it is evidence of the
    // publish root and `surge publish` republishes it.
    //
    // a package.json domain is deliberately not enough. it names a domain
    // without saying which directory holds the content, and it lives in
    // the source root - the one directory that must not go out. those
    // fall through to the prompt so the path can be corrected to ./dist.
    var local = discovery.local(x)
    if (local && local.source === "cname"){
      req.project = x
      helpers.log(helpers.smart("project:").grey + " " + req.project)
      return next()
    }

    return ask(path.join(x, path.sep))
  }

}
