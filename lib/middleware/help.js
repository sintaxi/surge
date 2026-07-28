var fs        = require("fs")
var helpers   = require("../util/helpers")
var discovery = require("./_shared/discovery")

var pad = function(str, width){
  while (str.length < width) str += " "
  return str
}

var sourceLabels = { cname: "CNAME found", pkg: "package.json", arg: "given" }

module.exports = function(req, next){
  if (req.argv.help || req.argv.h) {
    var name = req.configuration.name

    // contextual - mirrors the resolver: a passed domain wins, a passed
    // path resolves through its CNAME/package.json, cwd is just the
    // default path. a passed path that resolves nothing means no context
    // (never fall back to cwd and lie about the target).
    var local = null
    var pathSearched = false
    if (typeof req.argv.domain === "string" && helpers.validDomain(req.argv.domain)){
      local = { domain: req.argv.domain, source: "arg" }
    }
    if (!local){
      for (var i = 0; i < req.argv._.length; i++){
        var a = String(req.argv._[i])
        if (a.indexOf("@") === -1 && helpers.validDomain(a)){
          local = { domain: a, source: "arg" }
          break
        }
        var isPath = a === "." || a === ".." || a.indexOf("/") !== -1 || fs.existsSync(a)
        if (isPath){
          var found = discovery.local(a)
          if (found) local = { domain: found.domain, source: found.source, at: a }
          pathSearched = true
          break
        }
      }
    }
    if (!local && !pathSearched) local = discovery.local()

    var dom  = local ? "" : "[<domain>]"
    var domSp = local ? "" : "[<domain>] "
    var slotWidth = local ? 7 : 18

    var cmd = function(word, args){
      return "    " + name + " " + pad(word, 10) + (args ? args.grey : "")
    }

    var sub = function(word, slot, verbs){
      return "    " + name + " " + pad(word, 10) + pad(slot, slotWidth).grey + verbs.grey
    }

    helpers
      .log()
      .log("  " + req.configuration.platform.replace(/^\w/, c => c.toUpperCase()).underline.blue, ("⚡ " + req.pkg.description).brightYellow, req.pkg.version.grey)
      .log()

    if (local){
      var label = sourceLabels[local.source] || local.source
      if (local.at && local.at !== ".") label += " in " + local.at
      helpers
        .log("  " + local.domain.underline + (" (" + label + ")").grey)
        .log()
    }

    helpers
      .log("  " + "PUBLISHING".grey)
      .log(cmd("<path>", dom))
      .log(cmd("config", dom))
      .log(cmd("revs", dom))
      .log(cmd("rollback", dom))
      .log(cmd("rollfore", dom))
      .log(cmd("cutover", dom))
      .log(cmd("discard", domSp + "<rev>"))
      .log(cmd("invite", domSp + "<emails>"))
      .log(cmd("revoke", domSp + "<emails>"))
      .log(cmd("teardown", dom))
      .log(cmd("list"))
      .log()
      .log("  " + "SUB-COMMANDS".grey)
      .log(sub("dns", domSp + "<cmd>", "all·add·rem"))
      .log(sub("debug", domSp + "<cmd>", "status·files·audit·bust·certs·encrypt"))
      .log(sub("stats", domSp + "<cmd>", "traffic·load·audience·usage"))
      .log(sub("account", "<cmd>", "whoami·login·logout·verify·card·plan·nuke"))
      .log(sub("tokens", "<cmd>", "all·add·rem"))
      .log()
  } else {
    next()
  }
}

// namespace usage screens - shown for a bare noun. when the cwd resolves
// a domain (CNAME, package.json) a header announces it and the lines show
// exactly what to type - the domain slot only renders when nothing resolves.

var usageHeader = function(local, label){
  if (!local) return "[<domain>] "
  helpers
    .log("  " + local.domain.underline + (" (" + (sourceLabels[local.source] || local.source) + "). " + label + " commands...").grey)
    .log()
  return ""
}

module.exports.dnsUsage = function(name, local){
  helpers.log()
  var slot = usageHeader(local, "DNS")
  helpers
    .log("    " + name + " dns " + slot + "all".grey)
    .log("    " + name + " dns " + slot + "add <type> <name> <value>".grey)
    .log("    " + name + " dns " + slot + "rem <id>".grey)
    .log()
    .log("  " + "NS SERVERS (GEO)".grey)
    .log("  ns1.surge.world")
    .log("  ns2.surge.world")
    .log("  ns3.surge.world")
    .log("  ns4.surge.world")
    .log()
}

module.exports.debugUsage = function(name, local){
  helpers.log()
  var slot = usageHeader(local, "Debug")
  helpers
    .log("    " + name + " debug " + slot + "status".grey)
    .log("    " + name + " debug " + slot + "files".grey)
    .log("    " + name + " debug " + slot + "audit".grey)
    .log("    " + name + " debug " + slot + "bust".grey)
    .log("    " + name + " debug " + slot + "certs".grey)
    .log("    " + name + " debug " + slot + "encrypt".grey)
    .log()
}

module.exports.statsUsage = function(name, local){
  helpers.log()
  var slot = usageHeader(local, "Stats")
  helpers
    .log("    " + name + " stats " + slot + "traffic".grey)
    .log("    " + name + " stats " + slot + "load".grey)
    .log("    " + name + " stats " + slot + "audience".grey)
    .log("    " + name + " stats " + slot + "usage".grey)
    .log()
}

module.exports.accountUsage = function(name){
  helpers
    .log()
    .log("    " + name + " account " + "whoami".grey)
    .log("    " + name + " account " + "login".grey)
    .log("    " + name + " account " + "logout".grey)
    .log("    " + name + " account " + "verify".grey)
    .log("    " + name + " account " + "card".grey)
    .log("    " + name + " account " + "plan".grey)
    .log("    " + name + " account " + "nuke".grey)
    .log()
}

module.exports.tokensUsage = function(name){
  helpers
    .log()
    .log("    " + name + " tokens " + "all".grey)
    .log("    " + name + " tokens " + "add [--domain <domain>] [-m <msg>]".grey)
    .log("    " + name + " tokens " + "rem <id>".grey)
    .log()
}
