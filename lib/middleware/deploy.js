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
var split = require("split")



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

  // var progressBar = new ProgressBar('             upload:'.grey + ' [:bar] :percent, eta :etas', {
  //   complete: '=',
  //   incomplete: ' ',
  //   width: 20,
  //   total: req.projectSize
  // })

  var progress = {}

  var tick = function(tick){

    // change buffer to json
    try {

      var payload = JSON.parse(tick.toString())

      var displays = {
        "upload": ('             upload:').grey + ' [:bar] :percent, eta :etas',
           "cdn": ('   propigate on CDN:').grey + ' [:bar] :percent :file'
      }

      // create progress bar (if one doesnt exist)
      progress[payload.id] = progress[payload.id] || new ProgressBar(displays[payload.id], {
        complete: '=',
        incomplete: ' ',
        width: 20,
        total: payload.total
      })

      // increment
      progress[payload.id].update(payload.written / payload.total, { file: payload.file || "" })

    } catch(e) {}
  }

  var verbose = function(line){
    console.log("N", line.toString())
  }


  /**
   * Upload
   */

  // create upload
  var upload = request.put("http://" + req.argv.endpoint + "/" + req.domain, { headers: headers })

  // apply basic auth
  upload.auth("token", req.creds.token, true)

  // catch errors
  upload.on('error', console.log)

  // split replies on new line
  upload.pipe(split())

  // output result
  upload.on("data", tick)

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
