var fs = require("fs")
var request   = require("request")
var helpers   = require('./util/helpers')
var localCreds  = require("./util/creds.js")
var prompt      = helpers.prompt
var tar  = require('tar')
var zlib = require('zlib')
var fsReader  = require('fstream-ignore')
var surge    = require('../surge')
var ProgressBar = require("progress")



module.exports = function(req, next){

  headers = {
    "version" : req.pkg.version,
    "file-count": req.fileCount,
    "project-size": req.projectSize
  }

  if (req.argv.a)
    headers["add"] = req.argv.a.join(",")

  if (req.argv.r)
    headers["rem"] = req.argv.r.join(",")

  var upload = request({
    method: "PUT",
    headers: headers,
    uri: "http://" + req.argv.endpoint + "/" + req.domain
  }).auth("token", req.creds.token, true)


  var progressBar = new ProgressBar('             upload:'.grey + ' [:bar] :percent, eta :etas', {
  //var progressBar = new ProgressBar('[:bar]', {
    complete: '=',
    incomplete: ' ',
    width: 20,
    total: req.projectSize
  })

  upload.on('response', function(rsp){

    if (rsp.statusCode == 200) {
      rsp.on('data', function(chunk){

        try {
          var payload = JSON.parse(chunk)
        } catch(e) {
          console.log("error...", e)
          console.log("obj", chunk.toString())
        }


        if (payload.id === "upload" && !progressBar.complete) {
          progressBar.update(payload.written / req.projectSize)
        } else if (payload.id === "upload" && !progressBar.complete){
          //progressBar.update(payload.written / req.projectSize)
        }
      })

      rsp.on('end', function(stuff) {
        console.log('             status:'.grey, "done.")
        console.log()
        next()
      })

    } else if (rsp.statusCode == 403) {
      helpers.log()
      helpers.log("    Error:", "Forbidden to push to this project".red)
      helpers.log()
    } else {
      localCreds(req.argv.endpoint).set(null)
      helpers.log()
      helpers.log("    Error:", rsp.statusCode.toString().red)
      helpers.log()
    }
  })

  // var tarball = fs.createReadStream(req.tarballPath)
  // tarball.pipe(upload)

  var pack = tar.Pack()
  var zip = zlib.Gzip()
  var total = 0
  var project = fsReader({ 'path': req.project, ignoreFiles: [".surgeignore"] })
  project.addIgnoreRules([".git"])

  project.pipe(pack).pipe(zip).pipe(upload)

}
