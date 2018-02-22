var fs   = require("fs")
var path = require("path")
var tar  = require('tarr')
var zlib = require('zlib')
var fsReader  = require('fstream-ignore')
var ignore = require("surge-ignore")

module.exports = function(req, next){
  var pack = tar.Pack()
  var zip = zlib.Gzip()
  var project = fsReader({ 'path': req.project, ignoreFiles: [".surgeignore"] })
  project.addIgnoreRules(ignore)

  req.tarballPath = path.resolve("/tmp/", Math.random().toString().split(".")[1] + ".tar")

  var tarball = fs.createWriteStream(req.tarballPath)

  tarball.on("finish", function(e){
    next()
  })

  project.pipe(pack).pipe(zip).pipe(tarball)
}
