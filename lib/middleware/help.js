var helpers = require("../util/helpers")

var pad = function(str, width){
  while (str.length < width) str += " "
  return str
}

module.exports = function(req, next){
  if (req.argv.help || req.argv.h) {
    var name = req.configuration.name

    var cmd = function(word, args){
      return "    " + name + " " + pad(word, 10) + (args ? args.grey : "")
    }

    var sub = function(word, slot, verbs){
      return "    " + name + " " + pad(word, 10) + pad(slot, 18).grey + verbs.grey
    }

    helpers
      .log()
      .log("  " + req.configuration.platform.replace(/^\w/, c => c.toUpperCase()).underline.blue, ("⚡ " + req.pkg.description).brightYellow, req.pkg.version.grey)
      .log()
      .log("  " + "PUBLISHING".grey)
      .log(cmd("<path>", "[<domain>]"))
      .log(cmd("config", "[<domain>]"))
      .log(cmd("revs", "[<domain>]"))
      .log(cmd("rollback", "[<domain>]"))
      .log(cmd("rollfore", "[<domain>]"))
      .log(cmd("cutover", "[<domain>]"))
      .log(cmd("discard", "[<domain>] <rev>"))
      .log(cmd("invite", "[<domain>] <emails>"))
      .log(cmd("revoke", "[<domain>] <emails>"))
      .log(cmd("teardown", "[<domain>]"))
      .log(cmd("list"))
      .log(cmd("plan"))
      .log()
      .log("  " + "SUB-COMMANDS".grey)
      .log(sub("dns", "[<domain>] <cmd>", "all•add•rem"))
      .log(sub("debug", "[<domain>] <cmd>", "status•files•audit•bust•certs•encrypt"))
      .log(sub("stats", "[<domain>] <cmd>", "traffic•load•audience•usage"))
      .log(sub("account", "<cmd>", "whoami•login•logout•verify•card•nuke"))
      .log(sub("tokens", "<cmd>", "all•add•rem"))
      .log()
  } else {
    next()
  }
}

// namespace usage screens - shown for a bare noun. when the cwd resolves
// a domain (CNAME, package.json) a header announces it and the lines show
// exactly what to type - the domain slot only renders when nothing resolves.

var sourceLabels = { cname: "CNAME found", pkg: "package.json" }

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
