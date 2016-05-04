var fs = require("fs")
var request   = require("request")
var helpers   = require('./util/helpers')
var localCreds  = require("./util/creds.js")
var tar  = require('tar')
var zlib = require('zlib')
var fsReader  = require('fstream-ignore')
var surge    = require('../surge')
var ProgressBar = require("progress")
var split = require("split")
var url = require("url")
var ignore = require("surge-ignore")


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
   * Perform build on server
   */

  if (req.argv.build)
    headers["build"] = req.argv.build;


  /**
   * Force Protocol?
   */

  if (req.ssl !== null)
    headers["ssl"] = req.ssl

  /**
   * Progress Bars
   */

  var progress = {}


  /**
   * Our upload "data" handle
   */

  var tick = function(tick){
    if (Object.keys(progress).length > 1) global.ponr = true

    //try {

      try {
        var payload  = JSON.parse(tick.toString())
      } catch(e) {
        //console.log(e)
        return;
      }


      if (payload.hasOwnProperty("type") && payload.type === "error") {
        console.log()
        console.log()
        helpers.log("   Processing Error:".yellow, payload.error.filename).log()

        console.log(helpers.stacktrace(payload.error.stack, { lineno: payload.error.lineno }))
        helpers.log()
        console.log("  ", payload.error.message)

        console.log()
        process.exit(1)
        req.status = req.status || "Compile Error"
      } else

      if (payload.hasOwnProperty("type") && payload.type === "users") {
        helpers.log("              users:".grey, payload.users.join(", "))
      } else

      if (payload.hasOwnProperty("type") && payload.type === "collect") {
        var msg = "      Project requires the ".blue  + payload.plan.name.yellow + " plan. ".blue + ("$" + (payload.plan.amount / 100) + "/mo").yellow + " (cancel anytime).".blue

        helpers.log()
        if (payload.hasOwnProperty("perks")) {
          helpers.log(msg += " This plan provides...".blue)
          payload.perks.forEach(function(perk){
            helpers.log(("          - " + perk).blue)
          })
        } else {
          helpers.log(msg)
        }

        helpers.payment(req, payload["stripe_pk"], payload.card)(function(token){
          //console.log(token)
          var uri = url.resolve(req.endpoint, req.domain + "/subscription")
          request({
            uri: uri,
            method: "PUT",
            auth: {
              'user': 'token',
              'pass': req.creds.token,
              'sendImmediately': true
            },
            form: {
              plan: payload.plan,
              token: token
            }
          }, function(e,r,b){
            if (r.statusCode == 201 || r.statusCode == 200) {
              console.log()
              //if (token === null) console.log()
              //var sub = JSON.parse(b)
              //console.log("               plan:".grey, sub.plan.name)
            }
          })
        })

        // prompt for user
      } else
      if (payload.hasOwnProperty("type") && payload.type === "ip") {
        if (payload.data) {
          console.log("         IP Address:".grey, payload.data.ip)
        }
      } else
      if (payload.hasOwnProperty("type") && payload.type === "event_registration") {
        if (payload.data) {
          console.log()
          console.log(("             " + payload.data.event.name + " is set!").bold)

          if (payload.data.event.start)
            console.log("              start:".grey, payload.data.event.start)
          
          if (payload.data.event.end)
            console.log("                end:".grey, payload.data.event.end)

          if (payload.data.event.website)
            console.log("            website:".grey, payload.data.event.website)

          if (payload.data.event.email)
            console.log("              email:".grey, payload.data.event.email)

          if (payload.data.event.twitter)
            console.log("            twitter:".grey, payload.data.event.twitter)
        }
      } else


      if (payload.hasOwnProperty("type") && payload.type === "event_participant") {
        
        if (payload.data) {
          console.log()

          // end time
          var out = ["      You are in ".grey + payload.data.event.name.bold + "!".grey]
          if (payload.data.event.endTime)
            out.push("Competition ends in ".grey + payload.data.event.endTime.toString().green)

          // output
          console.log(out.join(" "))

          // help bar
          out = ["        w: ".grey + payload.data.event.website + "  e: ".grey + payload.data.event.email]

          // if (payload.data.event.website)
          //   console.log("            website:".grey, payload.data.event.website)

          // if (payload.data.event.email)
          //   console.log("              email:".grey, payload.data.event.email)

          if (payload.data.event.twitter)
            out.push("  t: ".grey, payload.data.event.twitter)

          console.log(out.join(""))
        }
      } else



      if (payload.hasOwnProperty("type") && payload.type === "subscription") {
        if (payload.data) {
          console.log("               plan:".grey, payload.data.plan.name)
        } else {
          console.log("               plan:".grey, "Free")
        }
      } else {
        try {
          // we have two different display for the progress bars
          var displays = {
            "upload": ('             upload:').grey + ' [:bar] :percent, eta: :etas',
               "cdn": ('   propagate on CDN:').grey + ' [:bar] :percent :file'
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
        } catch(e){
          //console.log(e)
        }

      }
    // } catch(e) {
    //   console.log("CATCH", e)
    // }
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
      if(rsp.headers.hasOwnProperty("reason")){
        helpers.log("    Aborted".yellow + " - " + rsp.headers["reason"])
      } else {
        helpers.log("    Aborted".yellow + " - you do not have permission to publish to " + req.domain)
      }
      helpers.log()
      process.exit(1)
    } else if (rsp.statusCode == 401) {
      localCreds(req.argv.endpoint).set(null)
      helpers.log()
      if(rsp.headers.hasOwnProperty("reason")){
        helpers.log("    Aborted".yellow + " - " + rsp.headers["reason"])
      } else {
        helpers.log("    Aborted".yellow + " - local token has expired and cleared. please try again.")
      }
      helpers.log()
      process.exit(1)
      // console.log(rsp.statusCode)
    }
  })

  // Read Project
  var project = fsReader({ 'path': req.project, ignoreFiles: [".surgeignore"] })

  // we always ignore .git directory
  project.addIgnoreRules(ignore)

  // chain all this together...
  project
    .pipe(tar.Pack())
    .pipe(zlib.Gzip())
    .pipe(handshake)

}
