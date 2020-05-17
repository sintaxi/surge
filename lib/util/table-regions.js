
var Table = require("cli-table3")

module.exports = function(payload, domain){
  
  var table = new Table({
    //head:[{ colSpan:4, content: payload.metadata.preview.grey, hAlign:"center" }],
    style: { 
      'compact': true,
      'padding-left': 3, 
      'padding-right': 3,
    }
  })

  var rows = []

  var report = function(str, status){
    if (["green"].indexOf(status) !== -1) return str.green
    return str.grey
  }

  var iterateMachines = function(machines){
    Object.keys(machines).forEach(function(key, i){
      var val = machines[key]
      table.push([
        { hAlign: "center", content: val.info.grey }, 
        (key + "." + val.apex),
        (val.country + ", " + val.city), 
        { hAlign:"center", content: report(val.report, val.status) }
      ])
    })
  }

  if (payload.hasOwnProperty("regions")) iterateMachines(payload.regions)
  if (payload.hasOwnProperty("nameservers")) iterateMachines(payload.nameservers)
  if (payload.hasOwnProperty("additional")) iterateMachines(payload.additional)

  return table

}    
  