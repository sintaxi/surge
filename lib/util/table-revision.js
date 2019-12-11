
var Table = require("cli-table3")


// returns a table
module.exports = function(project, revisions){
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

  revisions.forEach(function(revision){
    if (revision.current){
      var perm = revision.rev ? (revision.rev + ".") + project : ""
      var row = [
        (perm || project.domain).blue,
        revision.email.blue,
        (revision.fileCount.toString() + " files").blue,
        (revision.totalSize.toString() + " bytes").blue,
      ]
    } else {
      var perm = revision.rev ? (revision.rev + ".") + project : ""
      var row = [
        perm || project.domain,
        revision.email,
        revision.fileCount.toString() + " files",
        revision.totalSize.toString() + " bytes"
      ]
    }
    table.push(row)
  })

  return table

}
  
    
    
  