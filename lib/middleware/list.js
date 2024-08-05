var url         = require("url")
var Table       = require("cli-table3")
var helpers     = require("../util/helpers")
var surgeSDK    = require("surge-sdk")

module.exports = function(req, next){

  var sdk = surgeSDK({
    endpoint: req.endpoint.format(),
    defaults: helpers.defaults
  })

  var listAllProjects = function(){
    sdk.list({ user: "token", pass: req.creds.token }, function(error, projects){
      var table = new Table({
        //head: ["cmd".underline.grey, 'REV           DOMAIN'.grey, 'AGE'.grey, 'MODE'.grey],
        chars: { 'top': '' , 'top-mid': '' , 'top-left': '' , 'top-right': ''
               , 'bottom': '' , 'bottom-mid': '' , 'bottom-left': '' , 'bottom-right': ''
               , 'left': '  ' , 'left-mid': '' , 'mid': '' , 'mid-mid': ''
               , 'right': '' , 'right-mid': '' , 'middle': ' ' },
        style: { 'padding-left': 0, 'padding-right': 2 }
      })

      var lastcmd = ""
      if (projects.length != 0) {
        projects.forEach(function(project){
          //var perm = project.rev ? (project.rev + " ").grey + project.domain : ""
          var perm = project.domain
          if (project.planName) {
            if (project.planName.indexOf("Standard") !== -1){
              var pn = project.planName.grey
            }else{
              var pn = project.planName.blue
            }
          }
          var row = [
            perm || project.domain,
            (project.timeAgoInWords || "").grey,
            (project.cmd || "").grey,
            (project.platform || "").grey,
            pn || "",
            //lastcmd !== project.cmd ? (project.cmd).grey : "",
          ]
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

  var listSingleProject = function(){

    sdk.list(req.argv["_"][0], { user: "token", pass: req.creds.token }, function(error, revisions){
      revisions.reverse()
      var table = new Table({
        chars: { 'top': '' , 'top-mid': '' , 'top-left': '' , 'top-right': ''
               , 'bottom': '' , 'bottom-mid': '' , 'bottom-left': '' , 'bottom-right': ''
               , 'left': '  ' , 'left-mid': '' , 'mid': '' , 'mid-mid': ''
               , 'right': '' , 'right-mid': '' , 'middle': ' ' },
        style: { 'padding-left': 0, 'padding-right': 1 }
      })
      var lastcmd = ""
      var terminalBreakpoint = 100
      project = req.project
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


  if (req.argv["_"].length > 0) {
    listSingleProject()
  } else {
    listAllProjects()
  }

  

}
