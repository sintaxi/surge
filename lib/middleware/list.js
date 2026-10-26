var url         = require("url")
var Table       = require("cli-table3")
var helpers     = require("../util/helpers")
var surgeSDK    = require("surge-sdk")

var LIMIT = 50
var terminalBreakpoint = 100

// `acme:` - an org slug and its colon, nothing after
var isOrg = function(arg){
  return /^[a-z0-9][a-z0-9-]*:$/i.test(String(arg || ""))
}

// the owner's email, the org's slug, or shared: someone else's domain
// you can publish to, whose owner isn't yours to know
var ownerOf = function(project){
  var owner = project.owner
  if (!owner) return ""
  if (owner.account) return owner.account
  if (owner.org) return owner.org.slug
  return "shared"
}

// domain, owner, age, publisher, and on wide terminals files and size
var row = function(project, wide){
  var out = [
    project.domain,
    ownerOf(project).grey,
    (project.timeAgoInWords || "").grey,
    (project.email || "").grey
  ]
  if (wide){
    out.push((project.publicFileCount ? project.publicFileCount + " files" : "").grey)
    out.push((project.friendlySize || "").grey)
  }
  return out
}

module.exports = function(req, next){

  var sdk = surgeSDK({
    endpoint: req.endpoint.format(),
    defaults: helpers.defaults
  })

  // newest first, 50 at most unless --all; `acme:` keeps one org's.
  // No default handlers here, so a refusal prints the server's words
  var listAllProjects = function(){
    var arg = req.argv["_"][0]
    var opts = { limit: req.argv.all ? null : LIMIT }
    if (arg) opts.org = String(arg).slice(0, -1)
    var plain = surgeSDK({ endpoint: req.endpoint.format() })
    plain.list(opts, { user: "token", pass: req.creds.token }, function(error, projects, total){
      if (error){
        var why = error.messages && error.messages[0]
        helpers.space()
        helpers.trunc("Aborted".yellow + (" - " + (why || "could not list your domains")).grey)
        helpers.space()
        return process.exit(1)
      }
      if (opts.limit) projects = projects.slice(0, opts.limit)
      var table = new Table({
        chars: { 'top': '' , 'top-mid': '' , 'top-left': '' , 'top-right': ''
               , 'bottom': '' , 'bottom-mid': '' , 'bottom-left': '' , 'bottom-right': ''
               , 'left': '  ' , 'left-mid': '' , 'mid': '' , 'mid-mid': ''
               , 'right': '' , 'right-mid': '' , 'middle': ' ' },
        style: { 'padding-left': 0, 'padding-right': 2 }
      })

      if (projects.length != 0) {
        var wide = process.stdout.columns > terminalBreakpoint
        projects.forEach(function(project){
          table.push(row(project, wide))
        })
        helpers.space()
        helpers.log(table.toString())
        if (total > projects.length){
          helpers.space()
          helpers.trunc((projects.length + " of " + total + " - " + req.configuration.name + " list --all").grey)
        }
      } else {
        helpers.space()
        helpers.trunc(("Empty").grey)
      }
      return next()
    })
  }

  var listSingleProject = function(){

    sdk.list(req.domain || req.argv["_"][0], { user: "token", pass: req.creds.token }, function(error, revisions){
      if (error) return next(error)
      revisions.reverse()
      var table = new Table({
        chars: { 'top': '' , 'top-mid': '' , 'top-left': '' , 'top-right': ''
               , 'bottom': '' , 'bottom-mid': '' , 'bottom-left': '' , 'bottom-right': ''
               , 'left': '  ' , 'left-mid': '' , 'mid': '' , 'mid-mid': ''
               , 'right': '' , 'right-mid': '' , 'middle': ' ' },
        style: { 'padding-left': 0, 'padding-right': 1 }
      })
      var lastcmd = ""
      project = req.project || req.domain || ""
      if (revisions.length != 0) {
        revisions.forEach(function(revision){
          if (revision.current){
            var perm = revision.preview.blue.underline
            var row = [
              perm || project.domain.blue.underline,
              revision.timeAgoInWords.blue.underline,
              revision.email.blue.underline,
              (revision.publicFileCount ? (revision.publicFileCount + " files").underline.blue : ""),
              revision.friendlySize.blue.underline
            ]
            if (process.stdout.columns > terminalBreakpoint) row.push((revision.msg||"").blue)
          } else {
            var perm = revision.preview.grey
            var row = [
              perm || project.domain,
              revision.timeAgoInWords.grey,
              revision.email.grey,
              (revision.publicFileCount ? (revision.publicFileCount + " files").grey : ""),
              revision.friendlySize.grey
            ]
            if (process.stdout.columns > terminalBreakpoint) row.push((revision.msg || "").grey)
          }
          table.push(row)
          lastcmd = project.cmd
        })
        helpers.space()
        helpers.log(table.toString())
      } else {
        helpers.space()
        helpers.trunc(("Empty").grey)
      }
      return next()
    })
  }


  if (!req.domain && isOrg(req.argv["_"][0])) {
    listAllProjects()
  } else if (req.domain || req.argv["_"].length > 0) {
    listSingleProject()
  } else {
    listAllProjects()
  }

  

}

module.exports.row = row
module.exports.isOrg = isOrg
