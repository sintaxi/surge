
var Table = require("cli-table3")


// returns a table
module.exports = function(message, length){
  var table = new Table({
    chars: { 
      'mid': '', 
      'left-mid': '', 
      'mid-mid': '', 
      'right-mid': ''
    },
    style: { 
      'padding-left': 3, 
      'padding-right': 3
    }
  })

  table.push([{ colSpan:4, content: message }])

  return table

}
  
    
    
  