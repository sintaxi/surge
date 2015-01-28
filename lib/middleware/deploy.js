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
var url = require("url")


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
    headers["add"] = req.argv.a;


  /**
   * Collaborators to remove
   */

  if (req.argv.r)
    headers["rem"] = req.argv.r;


  /**
   * Progress Bars
   */

  var progress = {}


  /**
   * Our upload "data" handle
   */

  var tick = function(tick){

    try {

      var payload  = JSON.parse(tick.toString())

      if (payload.hasOwnProperty("type") && payload.type === "error") {
        console.log()
        helpers.log("    file name:", payload.error.filename.red)
        helpers.log("       lineno:", payload.error.lineno.red)
        console.log()
        console.log(helpers.stacktrace(payload.error.stack, { lineno: payload.error.lineno }))
        console.log()
        req.status = req.status || "Compile Error"
      }

      if (payload.hasOwnProperty("type") && payload.type === "users") {
        helpers.log("              users:".grey, payload.users)
      }

      // we have two different display for the progress bars
      var displays = {
        "upload": ('             upload:').grey + ' [:bar] :percent, eta: :etas',
           "cdn": ('   propigate on CDN:').grey + ' [:bar] :percent :file'
      }

      // create progress bar (if one doesnt exist)
      progress[payload.id] = progress[payload.id] || new ProgressBar(displays[payload.id], {
        complete: '=',
        incomplete: ' ',
        width: 20,
        total: payload.total
      })

      // clear file name on last update
      var file = payload.written >= payload.total
        ? ""
        : payload.file

      // refresh view
      progress[payload.id].update(payload.written / payload.total, { file: file })

    } catch(e) {
      //console.log("CATCH", e)
    }
  }

  var verbose = function(line){
    console.log("N", line.toString())
  }


  /**
   * Upload
   */

  // create upload
  var uri = url.resolve(req.endpoint, req.domain)
  var handshake = request.put(uri, { headers: headers })

  // apply basic auth
  handshake.auth("token", req.creds.token, true)

  // catch errors
  handshake.on('error', console.log)

  // split replies on new line
  handshake.pipe(split())

  // output result
  handshake.on("data", tick)

  // done
  handshake.on("end", next)

  handshake.on("response", function(rsp){
    if (rsp.statusCode == 403) {
      helpers.log()
      helpers.log("    Error:", "You do not have permission to deploy to this domain".red)
      helpers.log()
      process.exit()
    }
  })

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
    .pipe(handshake)

}
