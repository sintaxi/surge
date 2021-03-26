
var Table     = require("cli-table3")
var babar     = require("babar")
var url       = require("url")
var hrn       = require('human-readable-numbers').toHumanString

var cleanTable = {
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
      'middle': '  ' 
}

var chunkArrayInGroups = function(arr, size) {
  var result = [];
  for (var i=0; i<arr.length; i+=size)
    result.push(arr.slice(i, i+size));
  return result;
}

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

    // function chunkArrayInGroups(arr, size) {
    //   var result = [];
    //   for (var i=0; i<arr.length; i+=size)
    //     result.push(arr.slice(i, i+size));
    //   return result;
    // }

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

  var attrReport = function(poperty, color){
    if (color) return poperty[color]
    return poperty.grey
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

var analyticsAndUsageHeaderTitle = function(data){
  var first     = data.range[0]
  var last      = data.range[data.range.length -1]
  var startDate = new Date(first)
  var endDate   = new Date(last)

  var title = 
    startDate.toLocaleDateString("en", { month: "long"  })
    + " " 
    + first.split("-")[2]
    + " - "
    + endDate.toLocaleDateString("en", { month: "long"  })
    + " " 
    + last.split("-")[2]

  return title
}

exports.usage = function(data){
  var title = analyticsAndUsageHeaderTitle(data)

  // CHART
  //console.log(data)

  data.load.map(function(file){
    file.totalInMB = file.total / 1048576
    file.totalInGB = file.totalInMB / 1024
    file.totalInGBRounded = Math.round(file.totalInGB * 100) / 100
    return {}
  })

  var chartData = []  
  data.range.forEach(function(date, i){
    var day = parseInt(date.split("-")[2])
    var hit = data.general["bandwidth"]["breakdown"][i] / 1048576 / 1024
    chartData.push([i + 1, hit])
  })

  var chart = babar(chartData, {
    //caption: "Bandwidth (GB)",
    color: 'yellow',
    height: 8,
    width: 100
  })

  var arr = chart.split("\n")
  arr.pop()
  var chart = arr.join("\n")

  var table = new Table({
    colWidths: [50, 50],
    head: [],
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

  data.load.map(function(file){
    file.totalInMB = file.total / 1048576
    file.totalInGB = file.totalInMB / 1024
    file.totalInGBRounded = Math.round(file.totalInGB * 1000) / 1000
    return file
  })


  if (data.load.length > 0){

    // var header = "Bandwidth by File (ascending order)\n".grey +
    var header = "(file list may not represent all transfers)".italic.grey

    table.push([
      { content: ("USAGE".underline.brightMagenta + (" (" + title + ")").grey), colSpan: 2 },
    ])

    table.push([])

    var groups = chunkArrayInGroups(data.load.reverse(), Math.round(data.load.length / 2))
    groups[0].forEach(function(file, i){
      table.push([
        { content: (groups[0][i].totalInGBRounded.toString().padEnd(5, "0").cyan + " GB ".grey + groups[0][i].path.grey) },
        { content: groups[1][i] ? (groups[1][i].totalInGBRounded.toString().padEnd(5, "0").cyan + " GB ".grey + groups[1][i].path.grey) : "" }
      ])
    })

    table.push([])

    var totalInGB = data.general.bandwidth.total / 1048576 / 1024

    // table.push([
    //   { content: (Math.round(totalInGB * 1000) / 1000).toString().padEnd(5, "0") + " GB".grey + " HEADERS".grey }, ""
    // ])

    // table.push([
    //   { content: (Math.round(totalInGB * 1000) / 1000).toString().padEnd(5, "0") + " GB".grey + " BODY".grey }, ""
    // ])

    table.push([
      { 
        hAlign: "center",
        colSpan: 2,
        content: (Math.round(totalInGB * 1000) / 1000).toString().padEnd(5, "0").green + " GB".grey + " TOTAL BANDWIDTH".green }
    ])

  } else {
    table.push([
      { content: "Empty".yellow + " - Insufficient data.".grey, width:100 },
    ])
  }
  

  // TOTALS



  return table
}

exports.analytics = function(data){
  var title = analyticsAndUsageHeaderTitle(data)
  
  // CHART

  var chartData = []  
  data.range.forEach(function(date, i){
    var day = parseInt(date.split("-")[2])
    var hit = data.traffic["visits"]["breakdown"][i]
    chartData.push([i + 1, hit])
  })

  var chart = babar(chartData, {
    //caption: title,
    color: 'green',
    height: 8,
    width: 100
  })

  var arr = chart.split("\n")
  arr.pop()
  var chart = arr.join("\n")


  // TABLE

  var table = new Table({
    //head: [title + (" (Last "+ data.range.length + " days)").grey + (" calculated 7min ago\n").italic.yellow],
    //head: ["One", "two", "three", "four"],
    colWidths: [24, 24, 24, 24],
    chars: cleanTable,
    style: { 
      'padding-left': 0, 
      'padding-right': 0
    }
  })
  table.push([{ colSpan:4, content: ("TRAFFIC".underline.brightMagenta + (" (" + title + ")").grey) + "\n\n" + chart.toString(), hAlign:"left" }])


  // Top Routes
  var topRoutes = []
  //var pathList  = Object.keys(data.success)


  // data.success.forEach(function(hit){
  //   topRoutes.push(hit["total"].toString().padStart(7," ").blue + "  " + hit["path"])
  // })
  //data.success.length = 16

  var length = data.success[0]["total"].toString().length

  table.push([])

  var col

  summaryTable = new Table({
    chars: cleanTable,
    style: { 
      'padding-left': 3, 
      'padding-right': 3
    }
  })
  

  var summaryCol1 = new Table({
    chars: cleanTable,
    style: { 
      'compact': true,
      'padding-left': 0, 
      'padding-right': 0,
    }
  })

  var cleanDelta = function(d){
    if (d === Infinity) return "∞".green
    if (d === 0) return ""

    var r = Math.round(d * 100) / 100
    if (d > 5) return ("+" + r + "%").green
    if (d > 0) return ("+" + r + "%").green
    if (d > 0.9) return ("-" + r + "%").yellow
    return ("-" + r + "%").red
  }

  var noDays = data.range.length
  var connectionsYesterday  = data.traffic.connections.breakdown[noDays - 1]
  var connectionsAverage    = data.traffic.connections.breakdown[noDays - 2]
  var connectionsDelta      = (connectionsYesterday - connectionsAverage) / connectionsAverage * 100

  summaryCol1.push([
    { hAlign: "right", content: "Connections:".grey, },
    { hAlign: "right", content: hrn(data.traffic.connections.total).cyan },
    { hAlign: "left", content: cleanDelta(connectionsDelta) }
  ])

  var visitsYesterday  = data.traffic.visits.breakdown[noDays - 1]
  var visitsAverage    = 1000
  var visitsDelta      = (visitsYesterday - visitsAverage) / visitsAverage * 100

  summaryCol1.push([
    { hAlign: "right", content:      "Visits:".grey, },
    { hAlign: "right", content: hrn(data.traffic.visits.total).cyan  },
    { hAlign: "left", content: cleanDelta(visitsDelta) }
  ])

  var uniquesYesterday  = data.traffic.uniques.breakdown[noDays - 1]
  var uniquesAverage    = data.traffic.uniques.breakdown[noDays - 2]
  var uniquesDelta      = uniquesYesterday / uniquesAverage

  summaryCol1.push([
    { hAlign: "right", content: "Uniques:".grey, },
    { hAlign: "right", content: hrn(data.traffic.uniques.total).cyan },
    { hAlign: "left",  content: cleanDelta(uniquesDelta) }
  ])

  //var encryptedPct = data.general.connections.encryption.type
  var encryptionTotal  = data.encryption.connEn.total + data.encryption.connUn.total + data.encryption.connR2En.total + data.encryption.connR2Un.total
  
  var httpsPct         = data.encryption.connEn.total / (encryptionTotal) * 100
  var httpsPctRounded  = Math.round(httpsPct * 100) / 100

  var httpPct          = data.encryption.connUn.total / (encryptionTotal) * 100
  var httpPctRounded   = Math.round(httpPct * 100) / 100

  

  var r2UnPct          = data.encryption.connR2Un.total / (encryptionTotal) * 100
  var r2UnPctRounded   = Math.round(r2UnPct * 100) / 100


  var httpsRedirectPct = data.encryption.connEn.total / (data.encryption.connEn.total + data.encryption.connUn.total) * 100


  var summaryCol2 = new Table({
    //head:[{ colSpan:5, content: "", hAlign:"center" }],
    chars: cleanTable,
    style: { 
      'compact': true,
      'padding-left': 0, 
      'padding-right': 0,
    }
  })

  summaryCol2.push([
     { hAlign: "right", content: "Enctypted:".grey },
     { hAlign: "right", content: (httpsPctRounded + "%").green }
  ])

  if (data.encryption.connR2En.total > 0){
    var r2EnPct          = data.encryption.connR2En.total / (encryptionTotal) * 100
    var r2EnPctRounded   = Math.round(r2EnPct * 100) / 100
    summaryCol2.push([
       { hAlign: "right", content: "forced:".grey },
       { hAlign: "right", content: (r2EnPctRounded + "%").cyan }
    ])  
  }

  if (data.encryption.connR2Un.total > 0){
    var r2UnPct          = data.encryption.connR2Un.total / (encryptionTotal) * 100
    var r2UnPctRounded   = Math.round(r2UnPct * 100) / 100
    summaryCol2.push([
       { hAlign: "right", content: "HTTP forced:".grey },
       { hAlign: "right", content: (r2UnPctRounded + "%").cyan }
    ])  
  }


  // if (data.encryption.connEn.total > 0)
  //   summaryCol2.push("HTTP forced: ".padStart(22, " ").grey + (r2UnPctRounded + "%").red)


  // CACHE
  var cachePct           =  data.cache.hit.total / (data.cache.hit.total + data.cache.miss.total) * 100
  var cachePctRounded    =  Math.round(cachePct * 100) / 100
  var cacheMisses        =  data.cache.miss.total / (data.cache.hit.total + data.cache.miss.total) * 100
  var cacheMissesRounded =  Math.round(cacheMisses * 100) / 100

  var summaryCol3 = new Table({
    //head:[{ colSpan:5, content: "Hi", hAlign:"center" }],
    chars: cleanTable,
    style: { 
      'compact': true,
      'padding-left': 0, 
      'padding-right': 0,
    }
  })

  var cacheColor = "green"
  var cacheColor = "green"
  if (cachePctRounded < 99) cacheColor = "cyan"
  if (cachePctRounded < 95) cacheColor = "yellow"
  if (cachePctRounded < 90) cacheColor = "red"

  summaryCol3.push([
    { hAlign: "right", content: "Cache Hits:".grey }, 
    { hAlign: "right", content: (cachePctRounded + "%")[cacheColor] }
  ])

  summaryCol3.push([
    { hAlign: "right", content: "Missess:".grey }, 
    { hAlign: "left", content: data.cache.miss.total.toString()[cacheColor] }
  ])

  //
  summaryTable.push([
    { hAlign: "center", content: summaryCol1.toString() },
    { hAlign: "center", content: summaryCol2.toString() },
    { hAlign: "center", content: summaryCol3.toString() }
  ])

  table.push([
    { hAlign: "center", content: summaryTable.toString(), colSpan: 4}
  ])


  table.push([])

  var col1 = []
  if (data.success.length > 28) data.success.length = 28

  col1.push("VISITS".green)
  data.success.forEach(function(path, i){
    col1.push(hrn(path["total"]).padStart(6," ").green + "  " + path["path"].grey)
  })

  var col2 = []

  col2.push("NOT FOUND".red)
  data.fail.forEach(function(path, i){
    if (i > 7) return
    col2.push(hrn(path["total"]).padStart(6," ").red + "  " + path["path"].grey)
  })

  col2.push("\nREDIRECTS".yellow)
  data.redirect.forEach(function(path, i){
    if (i > 7) return
    col2.push(hrn(path["total"]).padStart(6," ").yellow + "  " + path["path"].grey)
  })

  col2.push("\nSOURCES".cyan)
  data.source.forEach(function(s, i){
    if (i > 7) return
    col2.push(hrn(s["total"]).padStart(6," ").cyan + "  " + url.parse(s["name"]).host.grey)
  })

  table.push([
    { 
      colSpan: 2,
      colWidths: 40,
      content: col1.join("\n")
    },
    { 
      colSpan: 2,
      colWidths: 40,
      content: col2.join("\n")
    }
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
