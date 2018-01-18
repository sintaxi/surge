var url         = require("url")
var request     = require("request")

var Table       = require("cli-table2")

module.exports = function(req, next){

  var options = {
    'url': url.resolve(req.endpoint, '/list'),
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
    //console.log()

    var table = new Table({
      head: ['REV           DOMAIN'.grey, 'AGE'.grey, 'MODE'.grey], 
      chars: { 'top': '' , 'top-mid': '' , 'top-left': '' , 'top-right': ''
             , 'bottom': '' , 'bottom-mid': '' , 'bottom-left': '' , 'bottom-right': ''
             , 'left': '  ' , 'left-mid': '' , 'mid': '' , 'mid-mid': ''
             , 'right': '' , 'right-mid': '' , 'middle': ' ' },
      style: { 'padding-left': 1, 'padding-right': 1 }
    })

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
          "3 days ago",
          pn || ""
        ]

        table.push(row)
      })

      console.log(table.toString())

    } else {
      console.log("    Empty".yellow, "- No Projects found.")
    }
    next()
  })

}