var helpers = require("../../util/helpers")

// A proxy set in the environment is not used unless node is told to use it.
// Two things go wrong quietly when that happens: on a network that only allows
// egress through the proxy every request fails with nothing pointing at the
// cause, and on a network that allows direct egress everything works while
// quietly going around a proxy the machine was configured to use. Neither is
// something to find out later, so say it once up front.

var configured = function(){
  return process.env.HTTPS_PROXY || process.env.https_proxy
      || process.env.HTTP_PROXY  || process.env.http_proxy
      || process.env.ALL_PROXY   || process.env.all_proxy
      || null
}

var major = function(){
  return parseInt(process.versions.node.split(".")[0], 10)
}

// node reads the proxy environment itself from 22 onward, and only when asked
var honoured = function(){
  return major() >= 22 && !!process.env.NODE_USE_ENV_PROXY
}

// entries are comma or space separated and may carry a leading dot and a port.
// "*" turns proxying off entirely.
var exempt = function(host){
  var list = (process.env.NO_PROXY || process.env.no_proxy || "").trim()
  if (!list) return false
  if (list === "*") return true

  return list.toLowerCase().split(/[,\s]+/).filter(Boolean).some(function(entry){
    var name = entry.replace(/^\./, "").replace(/:\d+$/, "")
    if (!name) return false
    return host === name || host.slice(-(name.length + 1)) === "." + name
  })
}

// returns whether it said anything, which is what the tests assert on
module.exports = function(req){
  // nothing has been asked of the network yet on these
  if (req.argv && (req.argv.help || req.argv.h || req.argv.version || req.argv.v)) return false

  if (!configured() || honoured()) return false

  var host = ((req.endpoint && req.endpoint.hostname) || "").toLowerCase()
  if (host && exempt(host)) return false

  var hint = major() >= 22
    ? "re-run with NODE_USE_ENV_PROXY=1 to route through it"
    : "proxy support needs node 22 or newer"

  helpers.space()
  helpers.trunc("Warning".yellow + " - proxy settings are not being used".grey)
  helpers.trunc(("          " + hint).grey)
  helpers.space()

  return true
}
