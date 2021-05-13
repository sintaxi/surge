
var url         = require("url")
var request     = require("request")
var Table       = require("cli-table3")
var helpers     = require("../../util/helpers")
//var inquirer    = require("inquirer")

var tableRevisions = require("../../util/table-revision.js")

module.exports = function(req, next){
  
  var options = {
    'url': url.resolve(req.endpoint.format(), '/list/' + req.argv["_"][0]),
    'method': 'get',
    'auth': {
      'user': "token",
      'pass': req.creds.token,
      'sendImmediately': true
    }
  }

  request(options, function(e, r, obj){
    if (e) throw e
    // TODO: handle 410
    // console.log(r.statusCode)

    var list = JSON.parse(obj)
    
    if (list.length == 0){
      helpers.trunc("Empty".blue + (" - There are no revisions for " + req.argv["_"][0]).grey)
      return next()
    } else {

      var table = tableRevisions(req.argv["_"][0], list)
      var rows  = table.toString().split("\n")

      var choice = function(revision, i){
        return {
          short: " ",
          value: revision,
          name: rows[i]
        }
      }

      var indexOfCurrent = 0
      var choices        = list.map(choice)

      var args = {
        type: 'list',
        name: 'revision',
        default: indexOfCurrent,
        choices: choices,
        pageSize: 8,
        separator: true,
        message: ' '
      }

      console.log("Feature not implemented")
      process.exit()
      // inquirer.prompt([args]).then(function (answers) {
      //   if (answers.revision.current){
      //     helpers.trunc("No change".green + " - Selected revision is already current".grey )
      //     return next()
      //   } else {
      //     return helpers.cutto(req.argv["_"][0], answers.revision.rev, next)
      //   }
      // })

    }
    
  })
  
}
