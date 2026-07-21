
var Table     = require("cli-table3")
var Chartscii = require("chartscii")
Chartscii     = Chartscii.default || Chartscii
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

var calculateDays = exports.calculateDays = function(data){
  // young sites may have fewer than 3 days of data — clamp so we
  // never index before the start of the range
  var todayIndex     = data.range.length -1
  var yesterdayIndex = Math.max(data.range.length -2, 0)
  var dayBeforeIndex = Math.max(data.range.length -3, 0)
  var todayDate      = data.range[todayIndex]
  var yesterdayDate  = data.range[yesterdayIndex]
  var dayBeforeDate  = data.range[dayBeforeIndex]

  // default to yesterday
  var focusDayIndex = yesterdayIndex
  var focusDayWord  = "yesterday"

  // focus on today if more traffic than yesterday (or today is all there is)
  if (todayIndex === yesterdayIndex || data.traffic.connections.s[todayIndex] > data.traffic.connections.s[yesterdayIndex]){
    focusDayIndex = todayIndex
    focusDayWord  = "today"
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

exports.instances = function(servers, dns){

  // when the server sent the observed dns verdict, the CERT/DNS rows live
  // in their own verdicts box above (see exports.verdicts) — the fleet
  // table carries no header at all
  if (dns && dns.hasOwnProperty("via")){
    return buildInstancesTable(servers, null)
  }

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

  return buildInstancesTable(servers, dnsTable
    ? [
        { hAlign: "center", vAlign: "center", content: "NS".grey },
        { colSpan: 5, content: dnsTable.toString(), hAlign: "left" }
      ]
    : null)

}

var buildInstancesTable = function(servers, head){

  var table = new Table({
    head: head || null,
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

// vertical bar chart of a daily series ({ s: [...] } shape), zero-based
// scale, 2-cell bars with the day-of-month under each. the current (still
// recording) UTC day renders grey so a half-counted day doesn't read as a
// traffic crash
var buildCurrentChart = function(range, dc, color, size){
  var today  = new Date().toISOString().slice(0, 10)
  var points = range.map(function(date, i){
    var point = { label: date.slice(8), value: dc["s"][i] }
    if (date === today) point.color = "#7a7a7a"
    return point
  })

  // pitch 4 (2-cell bar, 2 gap) up to 14 days; tighter pitch 3 beyond
  // that so a 28-day range stays inside the ~100-column layout
  var pitch = range.length > 14 ? 3 : 4

  var chart = new Chartscii(points, {
    type: "bar",
    orientation: "vertical",
    height: size || 3,
    width: range.length * pitch,
    barSize: 2,
    padding: 0,
    naked: true,
    color: color || "cyan"
  }).create()

  // naked mode leaves a blank row where the axis was — drop it so the
  // day labels sit directly under the bars. the last line is the day
  // labels, which chartscii tints per-bar — restyle the row plain grey
  var lines = chart.split("\n").filter(function(line){ return line.trim().length })
  lines.push(lines.pop().replace(/\x1b\[[0-9;]*m/g, "").grey)
  return lines.join("\n")
}

var padRight = function(str, len){
  return (str + Array(len + 1).join(" ")).slice(0, Math.max(len, str.length))
}

var regionNames = {
  US: "Americas", CA: "Americas",
  NL: "Europe", DE: "Europe", GB: "Europe",
  IN: "Asia", JP: "Asia", SG: "Asia",
  AU: "Oceania"
}

// last 7 full days vs the 7 before (today, still counting, is excluded).
// ✕ marks a datacenter that has taken no traffic for 3+ full days.
// arrows and colors mirror the traffic summary's cleanDelta treatment
var dcTrend = function(s){
  var full = s.slice(0, -1)
  if (full.slice(-3).reduce(function(a, b){ return a + b }, 0) === 0) return "✕".red
  if (full.length < 14) return " "
  var last7 = full.slice(-7).reduce(function(a, b){ return a + b }, 0)
  var prev7 = full.slice(-14, -7).reduce(function(a, b){ return a + b }, 0)
  if (prev7 === 0) return " "
  var delta = (last7 - prev7) / prev7
  if (delta > 0.1) return "↗".green
  if (delta < -0.1) return "↘".red
  return "→".grey
}

// ranked horizontal bars — one row per datacenter, sorted by total
// connections with share-of-total and a week-over-week direction.
// distribution is the question `load` answers, so no time axis here
var buildLoadChart = function(datacenters, total){
  var dcs = Object.keys(datacenters).map(function(name){
    var dc = datacenters[name]
    return { name: name.split(".")[0], city: dc["city"], t: dc["t"], trend: dcTrend(dc["s"]) }
  }).sort(function(a, b){ return b.t - a.t })

  var nameLen = dcs.reduce(function(len, dc){ return Math.max(len, dc.name.length) }, 0)
  var cityLen = dcs.reduce(function(len, dc){ return Math.max(len, dc.city.length) }, 0)

  // chartscii pads labels by raw string length, so ANSI codes in a label
  // shove the bars right — render label-less bars and compose the colored
  // label column ourselves
  var bars = new Chartscii(dcs.map(function(dc){ return { label: "", value: dc.t } }), {
    type: "bar",
    orientation: "horizontal",
    width: 50,
    naked: true,
    labels: false,
    color: "green",
    valueLabels: true,
    valueLabelFormat: function(values){
      return values.map(function(v){
        var share = total ? Math.round(Number(v) / total * 100) : 0
        return hrn(Number(v)).green + (" · " + share + "%").grey
      }).join("")
    }
  }).create().split("\n").filter(function(line){ return line.trim().length })

  var rows = dcs.map(function(dc, i){
    return (padRight(dc.name, nameLen) + "  " + padRight(dc.city, cityLen)).grey + "  " + dc.trend + "  " + (bars[i] || "").trim()
  })

  var legend = "↗ ↘ vs previous week".grey
  if (dcs.some(function(dc){ return dc.trend === "✕".red })) legend += "   ✕ no traffic 3+ days".grey
  return rows.join("\n") + "\n\n" + legend
}

// share of connections by world region, one line
var buildRegionLine = function(datacenters, total){
  var regions = {}
  Object.keys(datacenters).forEach(function(name){
    var region = regionNames[datacenters[name]["country"]] || "Other"
    regions[region] = (regions[region] || 0) + datacenters[name]["t"]
  })
  return Object.keys(regions).sort(function(a, b){ return regions[b] - regions[a] })
    .map(function(region){
      return (region + ":").grey + (" " + Math.round(regions[region] / total * 100) + "%").green
    }).join("   ")
}

exports.load = function(data){
  var days     = calculateDays(data)
  var title    = calculateTitle(data, "Load")
  var subtitle = calculateSubTitle(data)

  // datacenter totals, not data.traffic.connections — the header should
  // agree with what the rows below it sum to
  var total = Object.keys(data.datacenters).reduce(function(sum, name){
    return sum + data.datacenters[name]["t"]
  }, 0)

  var table = new Table({
    chars: cleanTable,
    style: {
      'padding-left': 0,
      'padding-right': 0
    }
  })

  table.push([{
    hAlign:"left",
    content: title
  }])

  table.push([
    {
      hAlign:"left",
      content: subtitle
    },
  ])

  table.push([])

  table.push([{
    hAlign: "left",
    content: hrn(total).green + (" connections / " + data.range.length + " days   ").grey + buildRegionLine(data.datacenters, total)
  }])

  table.push([])

  table.push([{
    hAlign: "left",
    content: buildLoadChart(data.datacenters, total)
  }])

  return table
}

exports.traffic = function(data){
  var days     = calculateDays(data)
  var title    = calculateTitle(data, "Traffic")
  var subtitle = calculateSubTitle(data)

  // CHART

  var uniques = data.traffic.uniques
  var peak    = Math.max.apply(null, uniques["s"])
  var chart   = "UNIQUES".green + ("  peak " + hrn(peak) + "/day").grey + "\n"
              + buildCurrentChart(data.range, uniques, "green", 12)


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

  var summaryTable = new Table({
    chars: cleanTable,
    style: {
      'padding-left': 0,
      'padding-right': 6
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
    if (isNaN(d)) return ""
    if (d === Infinity) return "+∞".grey
    if (d === 0) return ""

    var r = Math.round(d * 100) / 100
    if (d > 0) return (" " + r + "% ↗").green
    if (d > -3) return (r + "%").yellow
    return (r + "% ↘").red
  }

  // trend compares the two most recent COMPLETE days (yesterday vs the day
  // before) — today is still counting, so any comparison against it swings
  // wildly with the time of day the command runs
  var dayOverDay = function(series){
    var yesterday = series.s[days.yesterdayIndex]
    var dayBefore = series.s[days.dayBeforeIndex]
    return (yesterday - dayBefore) / dayBefore * 100
  }

  summaryCol1.push([
    { hAlign: "right", content:      "Visits:".grey, },
    { hAlign: "right", content: hrn(data.traffic.visits.t).grey  },
    { hAlign: "left", content: cleanDelta(dayOverDay(data.traffic.visits)) }
  ])

  summaryCol1.push([
    { hAlign: "right", content: "Uniques:".grey, },
    { hAlign: "right", content: hrn(data.traffic.uniques.t).grey },
    { hAlign: "left",  content: cleanDelta(dayOverDay(data.traffic.uniques)) }
  ])

  summaryCol1.push([
    { hAlign: "right", content: "Conns:".grey, },
    { hAlign: "right", content: hrn(data.traffic.connections.t).grey },
    { hAlign: "left", content: cleanDelta(dayOverDay(data.traffic.connections)) }
  ])

  //var encryptedPct = data.general.connections.encryption.type
  var encryptionTotal  = data.encryption.cE.t + data.encryption.cU.t + data.encryption.cRe.t + data.encryption.cRu.t
  
  var httpsPct         = encryptionTotal ? data.encryption.cE.t / (encryptionTotal) * 100 : 0
  var httpsPctRounded  = Math.round(httpsPct * 100) / 100

  var httpPct          = data.encryption.cU.t / (encryptionTotal) * 100
  var httpPctRounded   = Math.round(httpPct * 100) / 100

  var r2UnPct          = data.encryption.cRu.t / (encryptionTotal) * 100
  var r2UnPctRounded   = Math.round(r2UnPct * 100) / 100

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
  var cacheTotal         =  data.cache.hit.t + data.cache.miss.t
  var cachePct           =  cacheTotal ? data.cache.hit.t / cacheTotal * 100 : 0
  var cachePctRounded    =  Math.round(cachePct * 100) / 100
  var cacheMisses        =  cacheTotal ? data.cache.miss.t / cacheTotal * 100 : 0
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
  if (cacheTotal){
    if (cachePctRounded < 99) cacheColor = "cyan"
    if (cachePctRounded < 95) cacheColor = "yellow"
    if (cachePctRounded < 90) cacheColor = "red"
  }

  summaryCol3.push([
    { hAlign: "right", content: "Cache Hits:".grey }, 
    { hAlign: "right", content: (cachePctRounded + "%")[cacheColor] }
  ])

  summaryCol3.push([
    { hAlign: "right", content: "Misses:".grey },
    { hAlign: "right", content: hrn(data.cache.miss.t)[cacheColor] }
  ])

  summaryTable.push([
    { hAlign: "center", content: summaryCol1.toString() },
    { hAlign: "center", content: summaryCol2.toString() },
    { hAlign: "center", content: summaryCol3.toString() }
  ])

  table.push([
    { hAlign: "left", content: summaryTable.toString(), colSpan: 4}
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

// the verdicts box: CERT row(s) and the DNS row in one table, printed
// above the fleet table. its columns mirror the instances table below it:
// the label cell matches the label column, the main cell spans
// domain+city+ip, and the verdict cell spans provider+status — so the
// stacked boxes read as one aligned grid. widths comes from parsing the
// rendered instances table (see helpers.displayPublishInfo); a plain
// number falls back to a standalone layout.
exports.verdicts = function(certs, dns, widths, platform){

  var colWidths = Array.isArray(widths) && widths.length >= 6
    ? [ widths[0], widths[1] + widths[2] + widths[3] + 2, widths[4] + widths[5] + 1 ]
    : [ 10, widths - 40, 26 ]

  // not compact: each verdict row gets its own ruled-off band
  var table = new Table({
    colWidths: colWidths,
    style: {
      'padding-left': 3,
      'padding-right': 3,
    }
  })

  // one condensed line per cert: the covered names and the renewal state —
  // issuer and the rest live behind `surge certs`. renewal wording is the
  // point: provisioned certs and the platform wildcard are ours to renew —
  // never a user worry, so no countdown — while an uploaded pem expiring
  // genuinely is the user's move.
  ;(certs || []).forEach(function(cert){
    var names = (cert.subjectAltNames || []).join(", ")
    var platformCert = (cert.subjectAltNames || []).indexOf("*." + (platform || "surge.sh")) !== -1
    var renewal
    if (cert.autoRenew || cert.certName === "provisioned" || platformCert){
      renewal = "auto-renew".green
    }else if (cert.expInDays < 0){
      renewal = ("expired " + Math.abs(cert.expInDays) + " days ago").red
    }else if (cert.expInDays < 15){
      renewal = ("expires in " + cert.expInDays + " days").yellow
    }else{
      renewal = ("expires in " + cert.expInDays + " days").green
    }
    table.push([
      { hAlign: "center", content: "CERT".grey },
      { hAlign: "left", content: names.grey },
      { hAlign: "left", content: renewal }
    ])
  })

  // no cert yet: the CERT row carries the state instead of any text below
  // the publish result — waiting on dns when that is the blocker, securing
  // when the dns is fine and issuance is our move. grey either way: color
  // is reserved for the one cell that asks the user to act
  if ((certs || []).length === 0 && dns && dns.hasOwnProperty("via")){
    table.push([
      { hAlign: "center", content: "CERT".grey },
      { hAlign: "left", content: "none".grey },
      { hAlign: "left", content: dns.via ? "securing".grey : "waiting on dns".grey }
    ])
  }

  // the observed dns verdict: the mechanism on the left, the geo verdict
  // in its own cell. geo-aware is the flex — the one action a user ever
  // has (pointing dns) rides the cta line, never a block of records.
  if (dns && dns.hasOwnProperty("via")){
    var verdict = {
      "ns":    { how: "using Surge Name Servers".grey,  geo: "geo-aware".green },
      "cname": { how: "using Surge CNAME Record".grey,  geo: "geo-aware".green },
      "a":     { how: "using Surge A Record".grey,      geo: "not geo-aware".yellow }
    }[dns.via] || { how: "not resolving to Surge".grey, geo: "action required".yellow }

    table.push([
      { hAlign: "center", content: "DNS".grey },
      { hAlign: "left", content: verdict.how },
      { hAlign: "left", content: verdict.geo }
    ])
  }

  return table
}

// legacy cert box (old server sent no dns verdict) — same rows, no DNS
exports.certsShort = function(certs, widths, platform){
  return exports.verdicts(certs, null, widths, platform)
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
  table.push({ "Auto-Renew": [cert.autoRenew ? String(cert.autoRenew).green : String(!!cert.autoRenew).grey] })
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
