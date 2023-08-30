var fs = require("fs")
var helpers   = require('./util/helpers')
var localCreds  = require("./util/creds.js")
var tar  = require('tarr')
var zlib = require('zlib')
var fsReader  = require('surge-fstream-ignore')
var surge    = require('../surge')
var ProgressBar = require("progress")
var split = require("split")
var url = require("url")
var ignore = require("surge-ignore")


module.exports = function(req, next){
  req.success = false;

  /**
   * Some useful metadata
   */

  var headers = {
    "version" : req.pkg.version,
    "file-count": req.fileCount,
    "cmd": req.config.cmd,
    "project-size": req.projectSize,
    "timestamp": new Date().toJSON()
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

  req.headers = headers

  /**
   * Progress Bars
   */

  var progress = {}


  /**
   * Our upload "data" handle
   */

  var tick = function(tick){
    //console.log("tick", tick.toString())

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
        helpers.log(helpers.smart("users:").grey, payload.users.join(", "))
      } else

      if (payload.hasOwnProperty("type") && payload.type === "collect") {
        //console.log("payload:collect", payload)
        var msg = ("   " + payload.plan.name.underline + " plan requred. ").grey + ("$" + (payload.plan.amount / 100) + "/mo with a " + payload.plan.trial_period_days + " day trial").underline.grey

        helpers.log()
        if (payload.hasOwnProperty("perks")) {
          helpers.log(msg += "\n\n     Includes...".blue)
          payload.perks.forEach(function(perk){
            helpers.log(("       - " + perk).blue)
          })
          helpers.log()
        } else {
          helpers.log(msg)
        }

        req.plan = payload.plan.name

        helpers.payment(req, payload["stripe_pk"], payload.card)(function(token){

          // can this be passed in?
          var uri = new URL('subscription', req.endpoint)
          var auth = Buffer.from(`token:${req.creds.token}`).toString('base64')
          var body = new FormData()
          body.set('plan', payload.plan.id)
          body.set('token', token)
          body.set('timestamp', req.headers.timestamp)
          fetch(uri, {
            method: 'PUT',
            headers: {
              authorization: `Basic ${auth}`,
            },
            body,
          }).then(function(r){
            if (r.status == 201 || r.status == 200) {
              //console.log("here")
              if (token === null) console.log()
              // var sub = JSON.parse(b)
              // console.log("               plan:".grey, sub.plan.name)
            } else {
              console.log("ERROR")
            }
          }, function (e) {
            console.log("ERROR", e)
          })
        })

        // prompt for user
      } else
      if (payload.hasOwnProperty("type") && payload.type === "cert") {
          try{
            helpers.log(helpers.smart("encryption:").grey + " " + (payload.data.altnames || []).join(", ") + ( " (" + payload.data.expiresInWords + ")").grey)
          } catch(e){
            console.log("ERROR (please report error to support@surge.sh")
            console.log(e)
          }
      } else

      if (payload.hasOwnProperty("type") && payload.type === "ip") {
        req.success = true
        if (payload.data) {
          helpers.log(helpers.smart("IP:").grey + " " + payload.data.ip)
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
          //console.log("               plan:".grey, payload.data.plan.name)
        } else {
          //console.log("               plan:".grey, "Free")
        }
      } else {
        try {
          // we have two different display for the progress bars
          var displays = {
            "upload": helpers.smart('upload:').grey + ' [:bar] :percent eta: :etas'+ ( " (" + req.fileCount +' files, ' + req.projectSize + ' bytes)').grey,
               "cdn": helpers.smart('CDN:').grey + ' [:bar] :percent'
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
          if (!(payload.id === "cdn" && payload.end)){
            progress[payload.id].update(payload.written / payload.total, { file: file })  
          }
          
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

  // Read Project
  var project = fsReader({ 'path': req.project, ignoreFiles: [".surgeignore"] })

  // we always ignore .git directory
  project.addIgnoreRules(ignore)

  // chain all this together...
  var tarballStream = project
    .pipe(tar.Pack())
    .pipe(zlib.Gzip())

  // create upload
  var uri = new URL(req.endpoint, req.domain)
  let headers = {
    ...headers,
    auth: `Basic ${Buffer.from(`token:${req.creds.token}`).toString('base64')}`,
  }
  fetch(uri, {
    method: 'PUT',
    headers,
    body: ReadableStream.from(tarballStream),
  }).then(async function (rsp) {
    if (rsp.status === 403) {
      helpers.log()
      if(rsp.headers.has("reason")){
        helpers.trunc("Aborted".yellow + " - " + rsp.headers.get("reason"))
      } else {
        helpers.trunc("Aborted".yellow + (" - you do not have permission to publish to " + req.domain.underline).grey)
      }
      helpers.log()
      process.exit(1)
    } else if (rsp.status == 401) {
      localCreds(req.argv.endpoint).set(null)
      helpers.log()
      if(rsp.headers.has("reason")){
        helpers.trunc("Aborted".yellow + " - " + rsp.headers.get("reason"))
      } else {
        helpers.trunc("Aborted".yellow + " - local token has expired and cleared. please try again.")
      }
      helpers.log()
      process.exit(1)
      // console.log(rsp.status)
    }

    var splitStream = split()
    if (rsp.body) {
      for await (var chunk of rsp.body) {
        // output result
        tick()
        // split replies on new line
        splitStream.write(chunk)
      }
    }

    // done
    if (req.success === true) {
      return next()
    } else {
      helpers.log()
      helpers.log()
      helpers.log("   Error".red + " - Deployment did not succeed.".grey)
      helpers.log()
      process.exit(1)
    }

  }, function(er) {
    console.log(er)
  })
}
