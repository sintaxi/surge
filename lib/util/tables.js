
var Table = require("cli-table3")
var babar = require("babar")

var fqdn = function(domain){
  //return domain.match(/\.$/) ? domain : domain + "."
  return domain
}

var dotnotation = function(email){
  return email.replace("@", ".")
}

var condencedTableAttrs = {
  chars: { 
    'top': '' ,
    'top-mid': '' , 
    'top-left': '' , 
    'top-right': '',
    'bottom': '' ,
    'bottom-mid': '' ,
    'bottom-left': '' ,
    'bottom-right': '', 
    'left': '' ,
    'left-mid': '' ,
    'mid': '' ,
    'mid-mid': '',
    'right': '   ' ,
    'right-mid': '',
    'middle': '  ' },
  style: { 
    'padding-left': 0, 
    'padding-right': 0
  }
}

var revisionOutput = function(revision){
  if (!revision) return "Empty"
  return (
    revision.preview.underline 
    + "\n" + ("by " + revision.email) 
    + ("\n" + revision.publicFileCount + " files, " + revision.publicTotalSize + " size")
    + "\n" + new Date(revision.rev).toUTCString()
  )
}

exports.rollfore = function(response){
  var rollbackTable = new Table(condencedTableAttrs)
  rollbackTable.push([
    { hAlign: "left", content: revisionOutput(response.former).grey },
    [
    " ───┘\\ ",
    "      \\ ",
    "      / ",
    " ───┐/ "
    ].join("\n").grey,
    { hAlign: "left", content: revisionOutput(response.revision).blue }
  ])
  return rollbackTable
}

exports.rollback = function(response){
  var rollbackTable = new Table(condencedTableAttrs)
  rollbackTable.push([
    { hAlign: "left", content: revisionOutput(response.revision).blue },
    [
    "  /└─── ",
    " /",
    " \\",
    "  \\┌─── "
    ].join("\n").grey,
    { hAlign: "left", content: revisionOutput(response.former).grey }
  ])
  return rollbackTable
}

exports.instances = function(servers){
  var ns = servers.filter(i => i.type === "NS")
  if (ns && ns.length > 0){
    var dnsTable = new Table({
      chars: { 
        'top': '' ,
        'top-mid': '' , 
        'top-left': '' , 
        'top-right': '',
        'bottom': '' ,
        'bottom-mid': '' ,
        'bottom-left': '' ,
        'bottom-right': '', 
        'left': '' ,
        'left-mid': '' ,
        'mid': '' ,
        'mid-mid': '',
        'right': '   ' ,
        'right-mid': '',
        'middle': '  ' },
      style: { 
        'padding-left': 0, 
        'padding-right': 0
      }
    })

    function chunkArrayInGroups(arr, size) {
      var result = [];
      for (var i=0; i<arr.length; i+=size)
        result.push(arr.slice(i, i+size));
      return result;
    }

    var groups          = chunkArrayInGroups(ns.map(i => i.domain), 2)
    var nsServersStr    = groups.map(r => r.join("   ")).join("\n")
    var cnameDomainStr  = servers.filter(i => i.type === "CNAME").map(i => i.domain).join("\n")

    dnsTable.push([
      { hAlign: "left", content: nsServersStr.cyan },
      " ",
      { hAlign: "left", content: ("or " + "CNAME" + "…\n").grey.italic + cnameDomainStr.yellow.italic },
    ])  
  }
  
  var table = new Table({
    head: dnsTable ? [{ hAlign: "center", vAlign: "center", content: "NS".grey }, { colSpan:4,  content: dnsTable.toString(), hAlign:"left" }] : null,
    style: { 
      'compact': true,
      'padding-left': 3, 
      'padding-right': 3,
    }
  })

  //table.push([{rowSpan:8,content:'greetings\nfriends'}])

  var attrReport = function(str, status){
    if (["green"].indexOf(status) !== -1) return str.green
    return str.grey
  }

  servers.forEach(function(s){
    var arr = []

    var color = s.info === "pro" ? "grey" : null

    if(s.hasOwnProperty("type"))
      arr.push({ hAlign: "center", content: s.type.grey })

    if(s.hasOwnProperty("domain"))
      color
        ? arr.push(s.domain[color])
        : arr.push(s.domain)

    if(s.hasOwnProperty("location"))
      color
        ? arr.push(s.location[color])
        : arr.push(s.location)

    // if(s.hasOwnProperty("info")){
    //   if (["N/A", "available"].indexOf(s.info) !== -1){
    //     arr.push({ hAlign:"center", content: s.info.grey })
    //   }else{
    //     arr.push({ hAlign:"left", content: s.info })
    //   }
    // } 

    if(s.hasOwnProperty("ip"))
      color
        ? arr.push({ hAlign:"left", content: s.ip[color] })
        : arr.push({ hAlign:"left", content: s.ip })

    if(s.hasOwnProperty("provider"))
      color
        ? arr.push({ hAlign:"left", content: (s.provider || "")[color] })
        : arr.push({ hAlign:"left", content: s.provider })

    if(s.hasOwnProperty("status"))
      arr.push({ hAlign:"center", content: attrReport(s.confirmation, s.confirmationColor) + " " + attrReport(s.status, s.statusColor) })

    if (["NS", "CNAME"].indexOf(s.type) === -1) table.push(arr)
  })

  return table

}

exports.analytics = function(data){
  var first     = data.range[0]
  var last      = data.range[data.range.length -1]
  var startDate = new Date(first)
  var endDate   = new Date(last)

  var title = 
    startDate.toLocaleDateString("en", { month: "long"  }).cyan
    + " " 
    + first.split("-")[2].cyan
    + " - ".grey 
    + endDate.toLocaleDateString("en", { month: "long"  }).cyan
    + " " 
    + last.split("-")[2].cyan

  //var title = new Date(data.range[0] + " to " + data.range[data.range.length -1]

  var chartData = []
  
  data.range.forEach(function(date, i){
    var day = parseInt(date.split("-")[2])
    var hit = data.general["visits"]["breakdown"][i]
    // var hit = 0
    // hit += data.statuses["200"][i]
    // hit += data.statuses["301"][i]
    // hit += data.statuses["304"][i]
    // hit += data.statuses["404"][i]
    chartData.push([i + 1, hit])
  })


  var chart = babar(chartData, {
    //caption: title,
    color: 'green',
    height: 10,
    width: 100
  })

  // var chart = babar([
  //   [1, 100],
  //   [2, 100], [3, 101], [4, 102], [5, 103], [6, 105],
  //   [7, 106], [8, 107], [9, 108],
  //   [10, 200],
  //   [11, 306], [12, 107], [13, 108],
  //   [14, 900],
  //   [15,0],
  //   [16, 98],
  //   [17, 100], [18, 101], [19, 102], [20, 103], [21, 105],
  //   [22, 106], [23, 107], [24, 108],
  //   [25, 200],
  //   [26, 306],
  //   [27, 330],
  //   [28, 1230],
  //   [29, 830],
  //   [30, 930]
  // ], {
  //     caption: title,
  //     color: 'green',
  //     height: 10,
  //     width: 100
  // })

  //console.log(data)

  var table = new Table({
    head: [title + (" (Last "+ data.range.length + " days)").grey + (" calculated 7min ago\n").italic.yellow],
    chars: { 
      'top': '' ,
      'top-mid': '' , 
      'top-left': '' , 
      'top-right': '',
      'bottom': '' ,
      'bottom-mid': '' ,
      'bottom-left': '' ,
      'bottom-right': '', 
      'left': '' ,
      'left-mid': '' ,
      'mid': '' ,
      'mid-mid': '',
      'right': '   ' ,
      'right-mid': '',
      'middle': '  ' },
    style: { 
      'padding-left': 0, 
      'padding-right': 0
    }
  })
  table.push([{ colSpan:2, content: chart.toString(), hAlign:"left" }])


  // Top Routes
  var topRoutes = []
  //var pathList  = Object.keys(data.success)


  // data.success.forEach(function(hit){
  //   topRoutes.push(hit["total"].toString().padStart(7," ").blue + "  " + hit["path"])
  // })
  data.success.length = 16

  table.push([  
    
    '\nTOP ROUTES\n'.grey +
    data.success.map(function(hit){
      return hit["total"].toString().padStart(6," ").blue + "  " + hit["path"].green
    }).join("\n"), 

    '\nENCRYPTION\n'.grey +
    data.encryption.map(function(connection){
      return connection["total"].toString().padStart(6," ").blue + "  " + connection["type"]
    }).join("\n") + 

    '\n\nSOURCES\n'.grey +
    data.source.filter(function(s){
      if (s.name.indexOf(data.domain) === -1) return s
    }).map(function(hit){
      return hit["total"].toString().padStart(6," ").blue + "  " + hit["name"].cyan
    }).join("\n") +

    '\n\nSTATUS CODES\n'.grey +
    data.status.map(function(status){
      return status["total"].toString().padStart(6," ").blue + "  " + status["code"]
    }).join("\n")// + 
    // '\n\nBROWSERS'.grey + 
    // data.browser.map(function(browser){
    //   return browser["total"].toString().padStart(7," ").blue + "  " + browser["name"]
    // }).join("\n")

  ])

  data.fail.length = 6
  table.push([  
    '\nNOT FOUND\n'.grey +
    data.fail.map(function(hit){
      return hit["total"].toString().padStart(6," ").blue + "  " + hit["path"].red
    }).join("\n"), ""
  ])

  data.redirect.length = 6
  table.push([  
    '\nTOP REDIRECTS\n'.grey +
    data.redirect.map(function(hit){
      return hit["total"].toString().padStart(6," ").blue + "  " + hit["path"].yellow
    }).join("\n"), ""
  ])

  //data.source.length = 6
  table.push([  
    
  ])

  return table
}

exports.nameservers = function(servers){
  
  var table = new Table({
    head:[{ colSpan:5, content: "DNS", hAlign:"center" }],
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

  servers.forEach(function(s){
    var arr = []

    if(s.hasOwnProperty("type"))
      arr.push({ hAlign: "center", content: s.type.grey })

    if(s.hasOwnProperty("domain"))
      arr.push(s.domain)

    if(s.hasOwnProperty("location"))
      arr.push(s.location)

    if(s.hasOwnProperty("info")){
      if (["N/A", "available"].indexOf(s.info) !== -1){
        arr.push({ hAlign:"center", content: s.info.grey })
      }else{
        arr.push({ hAlign:"left", content: s.info.grey })
      }
    }

    if(s.hasOwnProperty("status"))
      arr.push({ hAlign:"center", content: report(s.status, s.statusColor) })

    if (s.type == "NS")
    table.push(arr)
  })

  return table

}

exports.certsShort = function(certs, colWidth){
  
  var table = new Table({
    colWidths:[colWidth - 23, 20],
    style: { 
      'compact': true,
      'padding-left': 2, 
      'padding-right': 2,
    }
  })

  certs.forEach(function(cert, i){
    var leftCol;
    var rightCol;  
    if (cert.expInDays < -15){
      leftCol = "Certificate: " + cert.issuer + "\n " + cert.subjectAltNames.join(", ")
      if (i < certs.length -1) leftCol = leftCol + "\n"
      rightCol = "Expired"
      table.push([leftCol.grey, rightCol.red])
    }else if(cert.expInDays < 0){
      leftCol = "Certificate: " + cert.issuer + "\n " + cert.subjectAltNames.join(", ")
      if (i < certs.length -1) leftCol = leftCol + "\n"
      rightCol = ("Expired\n" + Math.abs(cert.expInDays) + " days ago")
      table.push([leftCol.grey, rightCol.red])
    }else if(cert.expInDays < 15){
      leftCol = "Certificate: " + cert.issuer + "\n " + cert.subjectAltNames.join(", ")
      if (i < certs.length -1) leftCol = leftCol + "\n"
      rightCol = ("Valid\n" + Math.abs(cert.expInDays) + " more days")
      table.push([leftCol.grey, rightCol.yellow])
    }else{
      leftCol = "Certificate: " + cert.issuer + "\n " + cert.subjectAltNames.join(", ")
      if (i < certs.length -1) leftCol = leftCol + "\n"
      rightCol = ("Valid\n" + Math.abs(cert.expInDays) + " more days")
      table.push([leftCol.grey, rightCol.green])
    }
  })

  return table
}

exports.msgs = function(msgs, colWidth, color){
  var table = new Table({
    colWidths:[colWidth - 2],
    style: { 
      'compact': true,
      'padding-left': 2, 
      'padding-right': 2,
    }
  })
  msgs.forEach(function(msg, i){
    if (i % 2 === 1) table.push([""])
    table.push([{ content: msg.msg[msg.color], hAlign: msg.align || 'center' }])
  })
  return table
}

exports.cert = function(cert){
  
  var table = new Table({
    colWidths:[20, 60],
    style: { 
      'compact': true,
      'padding-left': 3, 
      'padding-right': 3,
    }
  })

  var row = {}
  var days = ""
  if (cert.expInDays < -15){
    days = ("Expired").red
  } else if (cert.expInDays < 0){
    days = (cert.expInDays.toString() + " days (expired)").red
  } else if (cert.expInDays > 15){
    days = (cert.expInDays.toString() + " days").green
  } else {
    days = (cert.expInDays.toString() + " days").yellow
  }
  table.push({ "Subject": [cert.subject] })
  table.push({ "Issuer": [cert.issuer] })
  table.push({ "Alt Names": cert.subjectAltNames.join(", ") })
  table.push({ "Expires": [days] })
  table.push({ "Auto-Renew": ["false".grey] })
  return table
}
  

exports.customRecords = function(dninfo){
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
      'padding-right': 0 
    },
    colWidths: [32, 6, 3, 50, 16]
  })

  dninfo.records.forEach(function(record){
    table.push([
      { hAlign: "left", content: record.name },
      { hAlign: "left", content: record.type.blue },
      { hAlign: "left", content: record.priority },
      { hAlign: "left", content: record.value.green.underline },
      { hAlign: "left", content: (record.id ? record.id : "").grey },
    ])
  })

  return table
  
}

exports.zone = function(dninfo){
  var records = dninfo.records

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
      'padding-right': 0
    }
  })

  // $ORIGIN
  table.push([
    { hAlign: "left", content: ("$ORIGIN " + fqdn(dninfo.origin)).grey, colSpan: 5 },
  ])

  // $TTL
  var ttl = dninfo.props ? (dninfo.props.ttl || 1600) : 1600
  table.push([
    { hAlign: "left", content: ("$TTL " + ttl).grey, colSpan: 5 },
  ])

  var current;

  dninfo.records.forEach(function(record){
    // if (current !== record.category){
    //   table.push([{ content: "", colSpan: 5 }])
    //   current = record.category
    // } 

    if (record.type === "SOA"){
      table.push([
        { hAlign: "left", content: fqdn(record.name).grey  },
        { hAlign: "left", content: record.type.grey  },
        { hAlign: "left", content: fqdn(record.value).grey },
        { hAlign: "left", content: dotnotation(record.email).grey },
        { hAlign: "left", content: ("( " + dninfo.serial + " 1d 2h 4w 1h )").grey },
      ])
    }else if (record.type === "NS"){
      table.push([
        { hAlign: "left", content: fqdn(record.name).grey },
        { hAlign: "left", content: record.type.grey },
        { hAlign: "left", content: fqdn(record.value).grey},
        { hAlign: "left", content: (record.id ? record.id : "").grey },
        { hAlign: "left", content: (record.category ? ("; " + record.category.toUpperCase()).grey : "; CUSTOM".grey) },
      ])
    }else if (record.category === "glue"){
      table.push([
        { hAlign: "left", content: fqdn(record.name).grey },
        { hAlign: "left", content: record.type.grey },
        { hAlign: "left", content: record.value.grey},
        { hAlign: "left", content: (record.id ? record.id : "").grey },
        { hAlign: "left", content: (record.category ? ("; " + record.category.toUpperCase()).grey : "; CUSTOM".grey) },
      ])
    }else{
      table.push([
        { hAlign: "left", content: record.name.grey },
        { hAlign: "left", content: record.type.grey },
        { hAlign: "left", content: record.value.grey},
        { hAlign: "left", content: (record.id ? record.id : "").grey },
        { hAlign: "left", content: (record.category ? ("; " + record.category.toUpperCase()).grey : "; CUSTOM".grey) },
      ])
    }
  })

  

  

  //table.push([{ hAlign: "left", content: "", colSpan: 4 }])

  // // SOA
  // table.push([
  //   { hAlign: "left", content: "surge.world.".grey },
  //   { hAlign: "left", content: "SOA".grey },
  //   { hAlign: "left", content: "ns1.surge.world".grey },
  //   { hAlign: "left", content: "username.example.com   ( 2007120710 1d 2h 4w 1h )".grey },
  // ])

  // table.push([{ hAlign: "left", content: "", colSpan: 4 }])

  // // NS
  // records.filter(function(record){ return record.type == "GLUE" }).forEach(function(record){
  //   table.push([
  //     { hAlign: "left", content: "surge.world.".grey },
  //     { hAlign: "left", content: "NS".grey },
  //     { hAlign: "left", content: (record.name + ".surge.world").grey },
  //     { hAlign: "left", content: "; New York".grey },
  //   ])
  // })

  // table.push([{ hAlign: "left", content: "", colSpan: 4 }])

  // // GLUE
  // records.filter(function(record){ return record.type == "GLUE" }).forEach(function(record){
  //   table.push([
  //     { hAlign: "left", content: record.name.grey },
  //     { hAlign: "left", content: "A".grey },
  //     { hAlign: "left", content: record.value.grey },
  //     { hAlign: "left", content: "; glue".grey },
  //   ])
  // })

  // table.push([{ hAlign: "left", content: "", colSpan: 4 }])


  // // A
  // records.filter(function(record){ return record.type == "A" }).forEach(function(record){
  //   table.push([
  //     { hAlign: "left", content: record.name.grey },
  //     { hAlign: "left", content: record.type.grey },
  //     { hAlign: "left", content: record.value.grey },
  //     { hAlign: "left", content: ";".grey + (record.id ? record.id : "N/A").grey },
  //   ])
  // })


  // // CNAME
  // records.filter(function(record){ return record.type == "CNAME" }).forEach(function(record){
  //   table.push([
  //     { hAlign: "left", content: record.name.grey },
  //     { hAlign: "left", content: record.type.grey },
  //     { hAlign: "left", content: record.value.grey },
  //     { hAlign: "left", content: ";".grey + record.id.grey },
  //   ])
  // })

  // records.forEach(function(record){
  //   if (record.id.indexOf("rec") === 0){
  //     var row = [
  //       { hAlign: "left", content: record.name.green },
  //       { hAlign: "left", content: record.type.green },
  //       { hAlign: "left", content: record.value.green },
  //       { hAlign: "left", content: "; ".green + record.id.green },
  //     ]
  //   }else{
  //     var row = [
  //       { hAlign: "left", content: record.name.grey },
  //       { hAlign: "left", content: record.type.grey },
  //       { hAlign: "left", content: record.value.grey },
  //       { hAlign: "left", content: "; resolved via Geo IP".grey },
  //     ]
  //   }
    
  //   table.push(row)
  // })

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
