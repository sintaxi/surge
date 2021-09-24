
var Table     = require("cli-table3")
var babar     = require("babar")
var url       = require("url")
var hrn       = require('human-readable-numbers').toHumanString
var xbytes    = require('xbytes');

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

var calculateDays = function(data){
  var todayIndex     = data.range.length -1
  var yesterdayIndex = data.range.length -2
  var dayBeforeIndex = data.range.length -3
  var todayDate      = data.range[todayIndex]
  var yesterdayDate  = data.range[yesterdayIndex]
  var dayBeforeDate  = data.range[dayBeforeIndex]

  // default to yesterday
  var focusDayIndex = yesterdayIndex
  var focusDayDate  = yesterdayDate
  var focusDayWord  = "yesterday"

  // focus on today if more traffic than yesterday
  if (data.traffic.connections.s[todayIndex] > data.traffic.connections.s[yesterdayIndex]){
    var focusDayIndex = todayIndex
    var focusDayWord  = "today"
  }

  return {
    todayIndex      : todayIndex,
    todayDate       : todayDate,
    yesterdayIndex  : yesterdayIndex,
    yesterdayDate   : yesterdayDate,
    dayBeforeIndex  : dayBeforeIndex,
    dayBeforeDate   : dayBeforeDate,
    focusDayIndex   : focusDayIndex,
    focusDayDate    : data.range[focusDayIndex],
    focusDayWord    : focusDayWord
  }
}

var calculateTitle = function(data, scope){
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

  return (scope.toUpperCase().underline.brightMagenta + (" (" + title + ")").grey) + ""
}

var calculateSubTitle = function(data){
  return ("calculated ".grey + data.normalizedAtInWords.brightYellow).italic
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


exports.audience = function(data){
  var days     = calculateDays(data)
  var title    = calculateTitle(data, "Audience")
  var subtitle = calculateSubTitle(data)

  var table = new Table({
    colWidths: [24, 24, 24, 24],
    chars: cleanTable,
    style: { 
      'padding-left': 0, 
      'padding-right': 0
    }
  })

  table.push([{ 
    colSpan:4, 
    hAlign:"left",
    content: title
  }])

  table.push([
    { 
      colSpan: 4,
      hAlign:"left",
      content: ("calculated ".grey + data.normalizedAtInWords.brightYellow).italic
    },
  ])

  table.push([])

  var col1 = new Table({
    chars: cleanTable,
    style: { 
      'padding-left': 0, 
      'padding-right': 0
    }
  })


  col1.push([
    { content: "BROWSER".grey }
  ])

  data.browser[days.focusDayDate].forEach(function(device){
    col1.push([
      { content: hrn(device.count).cyan, hAlign:"right" },
      { content: device.name.grey }
    ])
  })

  var col2 = new Table({
    chars: cleanTable,
    style: { 
      'padding-left': 0, 
      'padding-right': 0
    }
  })

  col2.push([
    { content: "OS".grey }
  ])

  data.os[days.focusDayDate].forEach(function(device){
    col2.push([
      { content: hrn(device.count).cyan, hAlign:"right" },
      { content: device.name.grey }
    ])
  })

  col2.push([])

  col2.push([
    { content: "DEVICES".grey }
  ])

  data.device[days.focusDayDate].forEach(function(device){
    col2.push([
      { content: hrn(device.count).cyan, hAlign:"right" },
      { content: device.name.grey }
    ])
  })

  

  table.push([
    { 
      colSpan: 2,
      hAlign:"left",
      content: col1.toString()
    },
    { 
      colSpan: 2,
      hAlign:"left",
      content: col2.toString()
    },
  ])

  return table
}


exports.audit = function(data){
  var table = new Table({
    chars: cleanTable,
  })
  //console.log(data)
  var edgenodes = Object.keys(data)
  edgenodes.forEach(function(edgenode){

    if (data[edgenode]["certError"]){
      if (data[edgenode]["certError"]["code"]){
        var cert = (data[edgenode]["certError"]["code"]).red
      }else if(data[edgenode]["certError"]["reason"]){
        var cert = (data[edgenode]["certError"]["reason"]).red
      }else{
        var cert = ("Unknown reason").red
      }
    }else{
      var cert = ("Cert Valid (" + data[edgenode]["cert"]["valid_to"] + ")").green
    }

    var en = edgenode.split(".")[0]
    table.push([
      { content: en },
      { content: data[edgenode]["rev"].toString().green },
      { content: (data[edgenode]["publicFileCount"] + " files").yellow },
      { content: xbytes(data[edgenode]["publicTotalSize"]).cyan },
      { content: cert }
    ])
  })
  return table
}


exports.plans = function(choices){

  // var head = choices.map(function(choice){
  //   return {
  //     content: choice.value.name,
  //     hAlign: "center"
  //   }
  // })

  // var table = new Table({
  //   head: head,
  //   chars: {},
  //   colWidths: [42, 42],
  //   style: { 
  //     'compact': true,
  //     'padding-left': 3, 
  //     'padding-right': 3,
  //   }
  // })

  // var row = []
  // choices.map(function(choice){
    
  //   row.push({
  //     content: choice.value.perks.join("\n- ") + "\n"
  //   })
  // }) 

  // table.push(row)

  var outerTable = new Table({
    chars: cleanTable,
    //colWidths: [42, 42],
    style: { 
      'compact': true,
      'padding-left': 0, 
      'padding-right': 0,
    }
  })

  // outerTable.push([
  //   {
  //     content: "Hello World",
  //     hAlign: "center"
  //   },
  //   {
  //     content: "Hello World",
  //     hAlign: "center"
  //   }
  // ])

  outerTable.push([{
    content: [
      "",
      "Select an Account Plan".blue,
      "upgrade or downgrade account at any time".italic.grey,
      ""
    ].join("\n"),
    colSpan: choices.length,
    hAlign: "center"
  }])

  var panels = []

  choices.forEach(function(choice){
    var price = choice.value.amount.toString().substring(0, choice.value.amount.toString().length - 2)
    var shortinter = choice.value.interval == "year" ? "yr" : "mo"
    
    var priceFormated
    if (choice.value.price == "00") {
      priceFormated = "Free"
    }else{
      priceFormated = "$" + price + "/" + shortinter 
    }
    var table = new Table({
      head: [{
        content: [choice.value.name, priceFormated].join("\n"),
        hAlign: "center"
      }],
      chars: {},
      colWidths: [38],
      style: { 
        'compact': true,
        'padding-left': 2, 
        'padding-right': 2,
      }
    })
    table.push([{
      content: choice.value.perks.join("\n- ") + "\n"
    }])

    panels.push(table.toString())
  })

  outerTable.push(panels)
  
  return outerTable
}

exports.manifest = function(manifest, domain){
  var table = new Table({
    chars: cleanTable,
    //colWidths: [9, 32, 50],
    style: { 
      'padding-left': 0, 
      'padding-right': 0
    }
  })

  var files = Object.keys(manifest)

  files.forEach(function(file){
    table.push([
      { content: xbytes(manifest[file]["size"]).cyan, hAlign: "right" },
      //{ content: manifest[file]["md5sum"].grey },
      { content: domain.green + file.grey, }

    ])
  })
  
  return table
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
  var days     = calculateDays(data)
  var title    = calculateTitle(data, "Usage")
  var subtitle = calculateSubTitle(data)


  var table = new Table({
    //colWidths: [50, 50],
    // head: [],
    chars: cleanTable,
    style: { 
      'padding-left': 0, 
      'padding-right': 0
    }
  })


  if (data.load[days.focusDayDate].length > 0){

    table.push([
      { content: title, colSpan: 3 },
    ])

    table.push([
      { content: subtitle, colSpan: 3 },
    ])

    table.push([])

    table.push([
      { content: days.focusDayWord.toUpperCase().grey, hAlign: "right" },
      { content: "MONTHLY".grey, hAlign: "right" },
      { content: "FILENAME".grey }
    ])


    data.load[days.focusDayDate].forEach(function(path){
      table.push([
        { content: xbytes(path.count).cyan, hAlign: "right" },
        { content: xbytes(path.count * 30).green, hAlign: "right" },
        { content: path.name.grey }
      ])
    })    

    table.push([])
    
    // table.push([
    //   { content: days.focusDayWord.grey, hAlign: "right" },
    //   { content: "monthly".grey, hAlign: "right", colSpan: 1 },
    //   { content: "", hAlign: "right", colSpan: 1 }
    // ])

    table.push([
      { content: "", hAlign: "right", colSpan: 1 },
      { content: (xbytes(data.bandwidth.all.t * 30)).underline.green, hAlign: "right", colSpan: 1 },
      { content: "ESTIMATED MONTHLY BANDWIDTH".underline.grey, hAlign: "left", colSpan: 1 }
    ])

  } else {
    table.push([
      { content: "Empty".yellow + " - Insufficient data.".grey, width:100 },
    ])
  }
  

  // TOTALS



  return table
}

var buildCurrentChart = function(range, dc, color, size){
  var chartData = []  
  range.forEach(function(date, i){
    var day = parseInt(date.split("-")[2])
    var hit = dc["s"][i]
    chartData.push([i + 1, hit])
  })
  var chart = babar(chartData, {
    //caption: title.grey,
    color: color || "cyan",
    height: size || 3,
    width: 100
  })

  var arr = chart.split("\n")
  arr.pop()
  var chart = arr.join("\n")

  return chart

}

exports.load = function(data){
  var days     = calculateDays(data)
  var title    = calculateTitle(data, "Load")
  var subtitle = calculateSubTitle(data)

  var table = new Table({
    //head: [title + (" (Last "+ data.range.length + " days)").grey + (" calculated 7min ago\n").italic.yellow],
    //head: ["One", "two", "three", "four"],
    //colWidths: [24, 24, 24, 24],
    chars: cleanTable,
    style: { 
      'padding-left': 0, 
      'padding-right': 0
    }
  })

  table.push([{ 
    colSpan:4, 
    hAlign:"left",
    content: title
  }])

  table.push([
    { 
      colSpan: 4,
      hAlign:"left",
      content: subtitle
    },
  ])

  table.push([])

  Object.keys(data.datacenters).forEach(function(dc){
    if (data.datacenters[dc]["t"] > 1){
      var c = buildCurrentChart(data.range, data.datacenters[dc], "cyan", 4)
      table.push([
        {
          content: c.toString() + "\n",
          hAlign: "right"
        },
        {
          content: data.datacenters[dc]["city"].underline.grey + "\n" + dc.split(".")[0].grey + ("\n" + hrn(data.datacenters[dc]["t"])).grey,
          hAlign: "left"
        }
      ])
    } 
  })

  var c = buildCurrentChart(data.range, data.traffic["connections"], "green", 4)

  table.push([
    {
      content: c.toString() + "\n",
      hAlign: "right"
    },
    {
      content: "TOTAL".underline.green + ("\n" + hrn(data.traffic["connections"]["t"])).green,
      hAlign: "left"
    }
  ])

  return table
}

exports.traffic = function(data){
  var days     = calculateDays(data)
  var title    = calculateTitle(data, "Traffic")
  var subtitle = calculateSubTitle(data)

  // CHART

  var chartData = []  
  data.range.forEach(function(date, i){
    var day = parseInt(date.split("-")[2])
    var hit = data.traffic.uniques["s"][i]
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

  table.push([{ 
    colSpan:4, 
    hAlign:"left",
    content: title
  }])

  table.push([
    { 
      colSpan: 4,
      hAlign:"left",
      content: subtitle
    },
  ])

  table.push([])

  table.push([{ 
    colSpan:4, 
    hAlign:"left",
    content: chart.toString()
  }])


  table.push([])

  // SUMARY TABLE

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
    if (d === Infinity) return "+∞".grey
    if (d === 0) return ""

    var r = Math.round(d * 100) / 100
    if (d > 5) return (" " + r + "% ↗").green
    if (d > 0) return (" " + r + "% ↗").green
    if (d > -3) return (r + "%").yellow
    return (r + "% ↙").red
  }

  var visitsYesterday  = data.traffic.visits.s[days.todayIndex]
  var visitsAverage    = data.traffic.visits.s[days.yesterdayIndex]
  var visitsDelta      = (visitsYesterday - visitsAverage) / visitsAverage * 100

  summaryCol1.push([
    { hAlign: "right", content:      "Visits:".grey, },
    { hAlign: "right", content: hrn(data.traffic.visits.t).grey  },
    { hAlign: "left", content: cleanDelta(visitsDelta) }
  ])

  var uniquesYesterday  = data.traffic.uniques.s[days.todayIndex]
  var uniquesAverage    = data.traffic.uniques.s[days.yesterdayIndex]
  var uniquesDelta      = uniquesYesterday / uniquesAverage

  summaryCol1.push([
    { hAlign: "right", content: "Uniques:".grey, },
    { hAlign: "right", content: hrn(data.traffic.uniques.t).grey },
    { hAlign: "left",  content: cleanDelta(uniquesDelta) }
  ])

  var connectionsfocusDay   = data.traffic.connections.s[days.focusDayIndex]
  var connectionsAverage    = data.traffic.connections.s[days.dayBeforeIndex]
  var connectionsDelta      = (connectionsfocusDay - connectionsAverage) / connectionsAverage * 100

  summaryCol1.push([
    { hAlign: "right", content: "Connections:".grey, },
    { hAlign: "right", content: hrn(data.traffic.connections.t).grey },
    { hAlign: "left", content: cleanDelta(connectionsDelta) }
  ])

  //var encryptedPct = data.general.connections.encryption.type
  var encryptionTotal  = data.encryption.cE.t + data.encryption.cU.t + data.encryption.cRe.t + data.encryption.cRu.t
  
  var httpsPct         = data.encryption.cE.t / (encryptionTotal) * 100
  var httpsPctRounded  = Math.round(httpsPct * 100) / 100

  var httpPct          = data.encryption.cU.t / (encryptionTotal) * 100
  var httpPctRounded   = Math.round(httpPct * 100) / 100

  var r2UnPct          = data.encryption.cRu.t / (encryptionTotal) * 100
  var r2UnPctRounded   = Math.round(r2UnPct * 100) / 100


  //var httpsRedirectPct = data.encryption.cE.t / (data.encryption.cU.t + data.encryption.cU.t) * 100
  var httpsRedirectPct = data.encryption.cE.t / (data.encryption.cU.t + data.encryption.cU.t) * 100

  // console.log(data.traffic)
  // console.log(data.encryption)

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
     { hAlign: "right", content: "Encrypted:".grey },
     { hAlign: "right", content: (httpsPctRounded + "%").green }
  ])

  if (data.encryption.cRe.t > 0){
    var r2EnPct          = data.encryption.cRe.t / (encryptionTotal) * 100
    var r2EnPctRounded   = Math.round(r2EnPct * 100) / 100
    summaryCol2.push([
       { hAlign: "right", content: "forced:".grey },
       { hAlign: "right", content: (r2EnPctRounded + "%").green }
    ])  
  }

  if (data.encryption.cRu.t > 0){
    var r2UnPct          = data.encryption.cRu.t / (encryptionTotal) * 100
    var r2UnPctRounded   = Math.round(r2UnPct * 100) / 100
    summaryCol2.push([
       { hAlign: "right", content: "HTTP forced:".grey },
       { hAlign: "right", content: (r2UnPctRounded + "%").cyan }
    ])  
  }

  if (data.encryption.cU.t > 0){
    summaryCol2.push([
      { hAlign: "right", content: "Naked:".grey },
      { hAlign: "right", content: hrn(data.encryption.cU.t).red }
    ])
  }else{
    summaryCol2.push([
      { hAlign: "right", content: "Naked:".grey },
      { hAlign: "right", content: hrn(data.encryption.cU.t).green }
    ])
  }
    


  // if (data.encryption.connEn.total > 0)
  //   summaryCol2.push("HTTP forced: ".padStart(22, " ").grey + (r2UnPctRounded + "%").red)

  // CACHE
  var cachePct           =  data.cache.hit.t / (data.cache.hit.t + data.cache.miss.t) * 100
  var cachePctRounded    =  Math.round(cachePct * 100) / 100
  var cacheMisses        =  data.cache.miss.t / (data.cache.hit.t + data.cache.miss.t) * 100
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
    { hAlign: "left", content: data.cache.miss.t.toString()[cacheColor] }
  ])

  summaryTable.push([
    { hAlign: "center", content: summaryCol1.toString() },
    { hAlign: "center", content: summaryCol2.toString() },
    { hAlign: "center", content: summaryCol3.toString() }
  ])

  table.push([
    { hAlign: "center", content: summaryTable.toString(), colSpan: 4}
  ])

  table.push([])

  // ROUTES
  
  if (data.success[days.focusDayDate].length > 28) data.success[days.focusDayDate].length = 28

  var col1 = []
  col1.push(("VISITS: ".green + days.focusDayWord.italic.grey))
  data.success[days.focusDayDate].forEach(function(route, i){
    col1.push(hrn(route.count).padStart(6," ").green + "  " + route.name.grey)
  })

  var col2 = []
  col2.push("NOT FOUND: ".red + days.focusDayWord.italic.grey)
  data.fail[days.focusDayDate].forEach(function(route, i){
    if (i > 7) return
    col2.push(hrn(route.count).padStart(6," ").red + "  " + route.name.grey)
  })

  col2.push("\nREDIRECTS: ".yellow + days.focusDayWord.italic.grey)
  data.redirect[days.focusDayDate].forEach(function(route, i){
    if (i > 7) return
    col2.push(hrn(route.count).padStart(6," ").yellow + "  " + route.name.grey)
  })

  col2.push("\nSOURCES: ".cyan + days.focusDayWord.italic.grey)
  data.source[days.focusDayDate].forEach(function(route, i){
    if (i > 7) return
    col2.push(hrn(route.count).padStart(6," ").cyan + "  " + route.name.grey)
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
  table.push({ "Auto-Renew": [cert.autoRenew ? cert.autoRenew.toString().green : cert.autoRenew.toString().grey] })
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
    colWidths: [32, 6, 3, 32, 16],
    wordWrap:true
  })

  dninfo.records.forEach(function(record){
    table.push([
      { hAlign: "left", content: record.name.grey },
      { hAlign: "left", content: record.type.blue },
      { hAlign: "left", content: (record.priority || "").toString().grey },
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
    },
    colWidths: [28, 6, 32, 16, 28],
    wordWrap:true
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
        { hAlign: "left", content: ("(" + dninfo.serial + " 1d 2h 4w 1h)").grey },
      ])
    }else if (record.type === "NS"){
      table.push([
        { hAlign: "left", content: fqdn(record.name).grey },
        { hAlign: "left", content: record.type.grey },
        { hAlign: "left", content: fqdn(record.value).grey},
        { hAlign: "left", content: (record.id ? record.id : "").grey },
        { hAlign: "left", content: (record.category ? (";" + record.category.toUpperCase()).grey : ";CUSTOM".grey) },
      ])
    }else if (record.category === "glue"){
      table.push([
        { hAlign: "left", content: fqdn(record.name).grey },
        { hAlign: "left", content: record.type.grey },
        { hAlign: "left", content: record.value.grey},
        { hAlign: "left", content: (record.id ? record.id : "").grey },
        { hAlign: "left", content: (record.category ? (";" + record.category.toUpperCase()).grey : ";CUSTOM".grey) },
      ])
    }else{
      table.push([
        { hAlign: "left", content: record.name.grey },
        { hAlign: "left", content: record.type.grey },
        { hAlign: "left", content: record.value.grey},
        { hAlign: "left", content: (record.id ? record.id : "").grey },
        { hAlign: "left", content: (record.category ? (";" + record.category.toUpperCase()).grey : ";CUSTOM".grey) },
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
