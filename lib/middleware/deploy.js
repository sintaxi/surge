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


  /**
   * Some useful metadata
   */

  var headers = {
    "version" : req.pkg.version,
    "file-count": req.fileCount,
    "project-size": req.projectSize
  }


  /**
   * Collaborators to add
   */

  if (req.argv.a)
    headers["add"] = req.argv.a.join(",")


  /**
   * Collaborators to remove
   */

  if (req.argv.r)
    headers["rem"] = req.argv.r.join(",")


  /**
   * Progress Bar
   */

  var progressBar = new ProgressBar('             upload:'.grey + ' [:bar] :percent, eta :etas', {
    complete: '=',
    incomplete: ' ',
    width: 20,
    total: req.projectSize
  })


  /**
   * Upload
   */

  // Create Upload
  var upload = request.put("http://" + req.argv.endpoint + "/" + req.domain, { headers: headers })

  // Apply Basic Auth
  upload.auth("token", req.creds.token, true)

  // Catch Errors
  upload.on('error', function(err) {
    console.log("Oops", err)
  })

  // Pipe to STDOUT
  upload.pipe(process.stdout)

  // upload.on('response', function(rsp){

  //   if (rsp.statusCode == 200) {
  //     rsp.on('data', function(chunk){

  //       try {
  //         var payload = JSON.parse(chunk)
  //       } catch(e) {
  //         console.log("error...", e)
  //         console.log("obj", chunk.toString())
  //       }


  //       if (payload.id === "upload" && !progressBar.complete) {
  //         progressBar.update(payload.written / req.projectSize)
  //       } else if (payload.id === "upload" && !progressBar.complete){
  //         //progressBar.update(payload.written / req.projectSize)
  //       }
  //     })

  //     rsp.on('end', function(stuff) {
  //       console.log('             status:'.grey, "done.")
  //       console.log()
  //       next()
  //     })

  //   } else if (rsp.statusCode == 403) {
  //     helpers.log()
  //     helpers.log("    Error:", "Forbidden to push to this project".red)
  //     helpers.log()
  //   } else {
  //     localCreds(req.argv.endpoint).set(null)
  //     helpers.log()
  //     helpers.log("    Error:", rsp.statusCode.toString().red)
  //     helpers.log()
  //   }
  // })


  // Read Project
  var project = fsReader({ 'path': req.project, ignoreFiles: [".surgeignore"] })

  // we always ignore .git directory
  project.addIgnoreRules([".git"])

  // chain all this together...
  project
    .pipe(tar.Pack())
    .pipe(zlib.Gzip())
    .pipe(upload)

}
