
var Table = require("cli-table3")

exports.records = function(records){
  var table = new Table({
    chars: { 
      'top': '' ,
      'top-mid': '' , 
      'top-left': '' , 
      'top-right': '',
      'bottom': '' ,
      'bottom-mid': '' ,
      'bottom-left': '' ,
      'bottom-right': '', 
      'left': '  ' ,
      'left-mid': '' ,
      'mid': '' ,
      'mid-mid': '',
      'right': '' ,
      'right-mid': '',
      'middle': ' ' },
    style: { 
      'padding-left': 0, 
      'padding-right': 5 
    }
  })

  records.forEach(function(record){
    var row = [
      { hAlign: "center", content: record.id.grey },
      { hAlign: "center", content: record.type.blue },
      { hAlign: "center", content: record.name.green },
      { hAlign: "right", content: record.value.green }
    ]
    table.push(row)
  })

  return table

}

exports.invites = function(invites){
  var table = new Table({
    chars: { 
      'top': '' ,
      'top-mid': '' , 
      'top-left': '' , 
      'top-right': '',
      'bottom': '' ,
      'bottom-mid': '' ,
      'bottom-left': '' ,
      'bottom-right': '', 
      'left': '  ' ,
      'left-mid': '' ,
      'mid': '' ,
      'mid-mid': '',
      'right': '' ,
      'right-mid': '',
      'middle': ' ' },
    style: { 
      'padding-left': 0, 
      'padding-right': 1 
    }
  })

  invites.forEach(function(invite){
    
    var row = [
      //invite.domain.yellow,
      invite.email.blue,
      invite.invite.underline.grey  
    ]

    if (invite.status == "sent"){
      row.push(invite.status.green)
    } else if (invite.status == "failed") {
      row.push(invite.status.red)
    }else{
      row.push(invite.status.yellow)
    }

    table.push(row)
  })

  return table
}
