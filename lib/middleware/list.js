var url         = require("url")
var request     = require("request")
var Table       = require("cli-table3")
var helpers     = require("../util/helpers")

module.exports = function(req, next){

  var listAllProjects = function(){
    var options = {
      'url': url.resolve(req.endpoint.format(), '/list'),
      'method': 'get',
      'auth': {
        'user': "token",
        'pass': req.creds.token,
        'sendImmediately': true
      }
    }

    request(options, function(e, r, obj){
      if (e) throw e
      var list = JSON.parse(obj)

      var table = new Table({
        //head: ["cmd".underline.grey, 'REV           DOMAIN'.grey, 'AGE'.grey, 'MODE'.grey],
        chars: { 'top': '' , 'top-mid': '' , 'top-left': '' , 'top-right': ''
               , 'bottom': '' , 'bottom-mid': '' , 'bottom-left': '' , 'bottom-right': ''
               , 'left': '  ' , 'left-mid': '' , 'mid': '' , 'mid-mid': ''
               , 'right': '' , 'right-mid': '' , 'middle': ' ' },
        style: { 'padding-left': 1, 'padding-right': 1 }
      })
      var lastcmd = ""
      if (list.length != 0) {
        list.forEach(function(project){
          var perm = project.rev ? (project.rev + " ").grey + project.domain : ""
          if (project.planName) {
            if (project.planName.indexOf("Standard") !== -1){
              var pn = project.planName.grey
            }else{
              var pn = project.planName.blue
            }
          }
          var row = [
            perm || project.domain,
            project.timeAgoInWords.grey,
            project.cmd.grey,
            project.platform.grey,
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
      next()
    })
  }

  var listSingleProject = function(){
    var options = {
      'url': url.resolve(req.endpoint.format(), req.argv["_"][0] + '/list'),
      'method': 'get',
      'auth': {
        'user': "token",
        'pass': req.creds.token,
        'sendImmediately': true
      }
    }
    request(options, function(e, r, obj){
      if (e) throw e
      var list = JSON.parse(obj)
      list.reverse()
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
      if (list.length != 0) {
        list.forEach(function(revision){

          if (revision.current){
            var perm = revision.rev ? (revision.rev + ".").yellow.underline + req.project.yellow.underline : ""
            var row = [
              perm || project.domain.blue.underline,
              revision.timeAgoInWords.blue.underline,
              revision.email.blue.underline,
              revision.fileCount.toString().blue.underline + " files".blue.underline,
              //revision.totalSize.toString().blue.underline + " bytes".blue.underline,
              revision.friendlySize.blue.underline
            ]
            if (process.stdout.columns > terminalBreakpoint) row.push((revision.msg||"").blue)
          } else {
            var perm = revision.rev ? (revision.rev + ".").yellow + req.project.yellow : ""
            var row = [
              perm || project.domain,
              revision.timeAgoInWords.grey,
              revision.email.grey,
              revision.fileCount.toString().grey + " files".grey,
              //revision.totalSize.toString().grey + " bytes".grey,
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
      next()
    })

  }


  if (req.argv["_"].length > 0) {
    listSingleProject()
  } else {
    listAllProjects()
  }

  

}
