
var Table = require("cli-table3")

module.exports = function(payload){
  
  var table = new Table({
    head:["Region".grey, "IP".grey, "Country".grey, "City".grey],
    style: { 
      'compact': true,
      'padding-left': 3, 
      'padding-right': 3,
    }
  })

  var keys = Object.keys(payload.regions)
  var rows = []
  
  keys.forEach(function(key){
    var val = payload.regions[key]
    table.push([(key + "." + payload.nsDomain), val.ip, { hAlign: "center", content: val.country }, val.city])
  })

  return table

}    
  