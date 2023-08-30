var Table       = require("cli-table3")
var helpers     = require("./util/helpers")

module.exports = function(req, next){

  var url = new URL('/list', req.endpoint.format())
  var authorization = `Basic ${Buffer.from(`token:${req.creds.token}`).toString('base64')}`
  var options = {
    headers: {
      authorization
    }
  }

  fetch(url, options).then(async function(r) {
    var list = await r.json()

    var table = new Table({
      //head: ["cmd".underline.grey, 'REV           DOMAIN'.grey, 'AGE'.grey, 'MODE'.grey],
      chars: { 'top': '' , 'top-mid': '' , 'top-left': '' , 'top-right': ''
             , 'bottom': '' , 'bottom-mid': '' , 'bottom-left': '' , 'bottom-right': ''
             , 'left': '  ' , 'left-mid': '' , 'mid': '' , 'mid-mid': ''
             , 'right': '' , 'right-mid': '' , 'middle': ' ' },
      style: { 'padding-left': 1, 'padding-right': 1 }
    })
    //console.log(req)
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
