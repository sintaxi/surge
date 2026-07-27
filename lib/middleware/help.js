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

// namespace usage screens - shown for a bare noun with no local domain

module.exports.dnsUsage = function(name){
  helpers
    .log()
    .log("    " + name + " dns [<domain>] " + "all".grey)
    .log("    " + name + " dns [<domain>] " + "add <type> <name> <value>".grey)
    .log("    " + name + " dns [<domain>] " + "rem <id>".grey)
    .log()
    .log("  " + "NS SERVERS (GEO)".grey)
    .log("  ns1.surge.world")
    .log("  ns2.surge.world")
    .log("  ns3.surge.world")
    .log("  ns4.surge.world")
    .log()
}

module.exports.debugUsage = function(name){
  helpers
    .log()
    .log("    " + name + " debug [<domain>] " + "status".grey)
    .log("    " + name + " debug [<domain>] " + "files".grey)
    .log("    " + name + " debug [<domain>] " + "audit".grey)
    .log("    " + name + " debug [<domain>] " + "bust".grey)
    .log("    " + name + " debug [<domain>] " + "certs".grey)
    .log("    " + name + " debug [<domain>] " + "encrypt".grey)
    .log()
}

module.exports.statsUsage = function(name){
  helpers
    .log()
    .log("    " + name + " stats [<domain>] " + "traffic".grey)
    .log("    " + name + " stats [<domain>] " + "load".grey)
    .log("    " + name + " stats [<domain>] " + "audience".grey)
    .log("    " + name + " stats [<domain>] " + "usage".grey)
    .log()
}
