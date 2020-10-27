
var Table = require("cli-table3")

var fqdn = function(domain){
  return domain.match(/\.$/) ? domain : domain + "."
}

var dotnotation = function(email){
  return email.replace("@", ".")
}

exports.servers = function(servers){
  
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

  servers.forEach(function(s){
    var arr = []

    if(s.hasOwnProperty("info"))
      arr.push({ hAlign: "center", content: s.info.grey })

    if(s.hasOwnProperty("domain"))
      arr.push(s.domain)

    if(s.hasOwnProperty("location"))
      arr.push(s.location)

    if(s.hasOwnProperty("ip")){
      
      if (["N/A", "available"].indexOf(s.ip) !== -1){
        arr.push({ hAlign:"center", content: s.ip.grey })
      }else{
        arr.push({ hAlign:"left", content: s.ip.grey })
      }
    }

    if(s.hasOwnProperty("status"))
      arr.push({ hAlign:"center", content: report(s.status, s.statusColor) })

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
      leftCol = cert.issuer + "\n " + cert.subjectAltNames.join(", ")
      if (i < certs.length -1) leftCol = leftCol + "\n"
      rightCol = "Expired"
      table.push([leftCol.red, rightCol.red])
    }else if(cert.expInDays < 0){
      leftCol = cert.issuer + "\n " + cert.subjectAltNames.join(", ")
      if (i < certs.length -1) leftCol = leftCol + "\n"
      rightCol = ("Expired\n" + Math.abs(cert.expInDays) + " days ago")
      table.push([leftCol.red, rightCol.red])
    }else if(cert.expInDays < 15){
      leftCol = cert.issuer + "\n " + cert.subjectAltNames.join(", ")
      if (i < certs.length -1) leftCol = leftCol + "\n"
      rightCol = ("Valid\n" + Math.abs(cert.expInDays) + " more days")
      table.push([leftCol.yellow, rightCol.yellow])
    }else{
      leftCol = cert.issuer + "\n " + cert.subjectAltNames.join(", ")
      if (i < certs.length -1) leftCol = leftCol + "\n"
      rightCol = ("Valid\n" + Math.abs(cert.expInDays) + " more days")
      table.push([leftCol.green, rightCol.green])
    }
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
      'padding-right': 5 
    }
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
      'padding-right': 5 
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
