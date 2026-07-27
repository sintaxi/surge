
// load help first so we can display and exit quickly
var help            = require('./middleware/help')

// modules
var fs              = require("fs")
var read            = require("read")
var minimist        = require('minimist')

// utils
var helpers         = require('./util/helpers')
var skin            = require('./util/skin.js')

// mini-libs that return middleware
var auth            = require("./middleware/_shared/auth")
var discovery       = require("./middleware/_shared/discovery")

// middleware
var whitelist       = require("./middleware/_shared/_whitelist")
var endpoint        = require("./middleware/_shared/_endpoint")
var pkg             = require("./middleware/_shared/_pkg")
var version         = require("./middleware/_shared/_version")
var welcome         = require("./middleware/_shared/_welcome")
var creds           = require("./middleware/_shared/_creds")
var tokencheck      = require("./middleware/_shared/_tokencheck")
var email           = require("./middleware/_shared/_email")
var project         = require("./middleware/_shared/_project")
var size            = require("./middleware/_shared/_size")
var protocol        = require("./middleware/_shared/_protocol")
var pemOrSilent     = require("./middleware/_shared/_pemOrSilent")
var ipaddress       = require("./middleware/_shared/_ipaddress")
var shorthand       = require("./middleware/_shared/_shorthand")
var plans           = require("./middleware/_shared/_plans")
var payment         = require("./middleware/_shared/_payment")
var setcard         = require("./middleware/_shared/_setcard")
var subscribe       = require("./middleware/_shared/_subscribe")
var weblinks        = require("./middleware/_shared/_weblinks")
var log             = require("./middleware/_shared/_log")

// also middleware but contains main functionality for command
var logout          = require("./middleware/logout")
var login           = require("./middleware/login")
var whoami          = require("./middleware/whoami")
var deploy          = require("./middleware/deploy")
var list            = require("./middleware/list")
var token           = require("./middleware/token")
var tokens          = require("./middleware/tokens")
var status          = require("./middleware/status")
var teardown        = require("./middleware/teardown")
var plus            = require("./middleware/plus")
var plan            = require("./middleware/plan")
var card            = require("./middleware/_shared/_card")
var ssl             = require("./middleware/ssl")
var select          = require("./middleware/select")
var rollback        = require("./middleware/rollback")
var rollfore        = require("./middleware/rollfore")
var cutover         = require("./middleware/cutover")
var bust            = require("./middleware/bust")
var analytics       = require("./middleware/analytics")
var traffic         = require("./middleware/traffic")
var load            = require("./middleware/load")
var audience        = require("./middleware/audience")
var usage           = require("./middleware/usage")
var audit           = require("./middleware/audit")
var discard         = require("./middleware/discard")
var invite          = require("./middleware/invite")
var revoke          = require("./middleware/revoke")
var encrypt         = require("./middleware/encrypt")
var certs           = require("./middleware/certs")
var dns             = require("./middleware/dns")
var config          = require("./middleware/config")
var files           = require("./middleware/files")
var nuke            = require("./middleware/nuke")
var verify          = require("./middleware/verify")
var account         = require("./middleware/account")



var exitifcurrentplan = function(req, next){
  if (req.plans.current && req.plans.current.id === req.selectedPlan.id){
    helpers.trunc("Success".green + (" - You remain on the " + req.plans.current.name.underline + " plan.").grey)
    helpers.space()
    process.exit()
  }else{
    return next()
  }
}


var space = function(req, next){ 
  helpers.space()
  next() 
}

var parse = function(arg){
  if(arg.hasOwnProperty("parent") && arg.parent.hasOwnProperty("rawArgs")){
    arg = arg.parent.rawArgs.slice(3)
  } else if (arg.argv && arg.argv._) {
    arg = arg.parsed.argv._.slice(1)
  }
  return arg instanceof Array
    ? minimist(arg)
    : arg
}

module.exports = function(configuration){
  configuration = configuration || {}

  var ep = configuration.endpoint
    ? configuration.endpoint
    : configuration.platform ? "https://surge." + configuration.platform : 'https://surge.surge.sh'

  configuration.platform = configuration.platform || "surge.sh"
  configuration.name = configuration.name || "surge"

  var options = {
    alias: {
      p: 'project',
      d: 'domain',
      e: 'endpoint',
      a: 'add',
      r: 'remove',
      s: 'stage',
      m: 'message'
    },
    default: { e: ep, s: false }
  }

  var authInfo = function(req, next){
    var str = ("Running as " + req.account.email.underline).grey
    if (req.account.plan){ str = str + (" (" + req.account.plan.name + ")").grey }
    helpers.space()
    helpers.trunc(str)
    helpers.space()
    return next()
  }

  var surge = function(args){
    // will be one of:
    // commander, yargs, process.argv.split(2), OR minimist

    var argv = minimist(args, options)
    var cmd  = argv._[0] != null ? String(argv._[0]) : null

    // we accept --preview
    if (argv.preview) argv.stage = argv.s = argv.preview

    var commands = [
      "login", 
      "logout", 
      "whoami",
      "verify",
      "list",
      "revs",
      "rollback",
      "rollfore",
      "cutover", 
      "discard", 
      "publish", 
      "teardown", 
      "select",
      "status",
      "token",
      "tokens",
      "plus",
      "ssl", 
      "plan", 
      "card",
      "invite",
      "revoke",
      "encrypt",
      "config",
      "dns",
      "zone",
      "debug",
      "stats",
      "account",
      "certs",
      "files",
      "audit",
      "bust",
      "analytics",
      "usage",
      "traffic",
      "load",
      "audience",
      "nuke",
      ]

    if (cmd && commands.indexOf(cmd) !== -1) {
      argv._.shift()
      return surge[cmd]({})(argv)
    }

    // library consumers may route anything unrecognized to one command
    if (configuration.default && commands.indexOf(configuration.default) !== -1){
      return surge[configuration.default]({})(argv)
    }

    // the mv contract - a path or a domain is a publish
    if (cmd){
      if (cmd === "." || cmd === ".." || cmd.indexOf("./") === 0 || cmd.indexOf("../") === 0 ||
          cmd.indexOf("/") === 0 || cmd.indexOf("~") === 0 || fs.existsSync(cmd)){
        return surge.publish({})(argv)
      }
      if (helpers.validDomain(cmd)){
        argv._.unshift(".")
        return surge.publish({})(argv)
      }
      helpers.space()
      helpers.trunc("Aborted".yellow + (" - `" + cmd + "` is not a surge command. Try `surge --help`.").grey)
      helpers.space()
      return process.exit(1)
    }

    // flag-style publish (CI: surge -p ./dist -d example.com)
    if (argv.project || argv.p || argv.domain || argv.d){
      return surge.publish({})(argv)
    }

    // bare surge - help in a terminal, a loud pointer in a pipeline
    skin({
      configuration: configuration,
      argv: argv,
      read: read
    }, [whitelist, pkg, version, function(req){
      if (process.stdout.isTTY || req.argv.help || req.argv.h){
        req.argv.help = true
        return help(req, function(){})
      }
      console.error("surge requires a path - try `surge <path> [<domain>]` or `surge --help`")
      process.exit(1)
    }])
  }

  var stub = function(req, next){ 
    return next(); 
  }

  surge.token = function(hooks){
    var hooks = hooks || {}
    var preAuth     = hooks.preAuth       || stub
    var postAuth    = hooks.postAuth      || stub
    var onion = [
      whitelist, endpoint, pkg, help, version, space,
      preAuth, creds, auth, postAuth,
      token, space
    ]
    return function(){
      var argv = parse(arguments[arguments.length -1])
      skin({
        configuration: configuration,
        argv: argv,
        read: read
      }, onion)
    }
  }

  // tokens namespace - all•add•rem, bare = all. add/rem ride the token
  // machinery, which reads the verb from argv._[0] itself
  surge.tokens = function(hooks){
    var hooks = hooks || {}
    var preAuth     = hooks.preAuth       || stub
    var postAuth    = hooks.postAuth      || stub
    var onion = [
      whitelist, endpoint, pkg, help, version, space,
      preAuth, creds, auth, postAuth,
      tokens, space
    ]
    return function(){
      var argv = parse(arguments[arguments.length -1])
      var verb = argv._[0] != null ? String(argv._[0]) : null

      if (verb === "add" || verb === "rem") return surge.token(hooks)(argv)

      if (verb !== null && verb !== "all"){
        helpers.space()
        helpers.trunc("Aborted".yellow + (" - `" + verb + "` is not a " + configuration.name + " tokens command. Try `" + configuration.name + " --help`.").grey)
        helpers.space()
        return process.exit(1)
      }

      if (verb === "all") argv._.shift()
      skin({
        configuration: configuration,
        argv: argv,
        read: read
      }, onion)
    }
  }

  surge.login = function(hooks){
    var hooks = hooks || {}
    var preAuth     = hooks.preAuth       || stub
    var postAuth    = hooks.postAuth      || stub
    var onion = [
      whitelist, endpoint, pkg, help, version, space,
      preAuth, auth, postAuth,
      login, space
    ]
    return function(){
      var argv = parse(arguments[arguments.length -1])
      skin({
        configuration: configuration,
        argv: argv,
        read: read
      }, onion)
    }
  }

  surge.logout = function(hooks){
    var hooks = hooks || {}
    var onion = [
      whitelist, endpoint, pkg, help, version, space,
      creds, logout, space
    ]
    return function(){
      var argv = parse(arguments[arguments.length -1])
      skin({
        configuration: configuration,
        argv: argv,
        read: read
      }, onion)
    }
  }

  surge.publish = function(hooks){
    var hooks = hooks || {}
    var preAuth     = hooks.preAuth       || stub
    var postAuth    = hooks.postAuth      || stub
    var preProject  = hooks.preProject    || stub
    var postProject = hooks.postProject   || stub
    var preSize     = hooks.preSize       || stub
    var postSize    = hooks.postSize      || stub
    var preDomain   = hooks.preDomain     || stub
    var postDomain  = hooks.postDomain    || stub
    var prePublish  = hooks.prePublish    || stub
    var postPublish = hooks.postPublish   || stub
    var onion = [
      whitelist, endpoint, pkg, help, version, space,
      preAuth, creds, welcome, auth, authInfo, postAuth, shorthand,
      preProject, project, postProject,
      preDomain, discovery.resolve({ positional: false, prompt: true, generate: true, log: true }), protocol, postDomain,
      preSize, size, postSize,
      prePublish, deploy, postPublish, ipaddress
    ]
    return function(){
      var argv = parse(arguments[arguments.length -1])
      skin({
        configuration: configuration,
        argv: argv,
        read: read
      }, onion)
    }
  }

  surge.whoami = function(hooks){
    var hooks = hooks || {}
    var onion = [
      whitelist, endpoint, pkg, help, version, space,
      creds, whoami
    ]
    return function(){
      var argv = parse(arguments[arguments.length -1])
      skin({
        configuration: configuration,
        argv: argv,
        read: read
      }, onion)
    }
  }

  surge.verify = function(hooks){
    var hooks = hooks || {}
    var preAuth   = hooks.preAuth  || stub
    var postAuth  = hooks.postAuth || stub
    var onion = [
      whitelist, endpoint, pkg, help, version, space,
      preAuth, creds, welcome, auth, postAuth,
      verify
    ]
    return function(){
      var argv = parse(arguments[arguments.length -1])
      skin({
        configuration: configuration,
        argv: argv,
        read: read
      }, onion)
    }
  }

  surge.list = function(hooks){
    var hooks = hooks || {}
    var preAuth   = hooks.preAuth  || stub
    var postAuth  = hooks.postAuth || stub
    var onion = [
      whitelist, endpoint, pkg, help, version, space,
      preAuth, creds, welcome, auth, postAuth, shorthand,
      list, space
    ]
    return function(){
      var argv = parse(arguments[arguments.length -1])
      skin({
        configuration: configuration,
        argv: argv,
        read: read
      }, onion)
    }
  }

  surge.rollback = function(hooks){
    var hooks = hooks || {}
    var preAuth   = hooks.preAuth  || stub
    var postAuth  = hooks.postAuth || stub
    var onion = [
      whitelist, endpoint, pkg, help, version,
      preAuth, creds, welcome, auth, postAuth,
      discovery.resolve({ extras: true }), rollback, space
    ]
    return function(){
      var argv = parse(arguments[arguments.length -1])
      skin({
        configuration: configuration,
        argv: argv,
        read: read
      }, onion)
    }
  }

  surge.rollfore = function(hooks){
    var hooks = hooks || {}
    var preAuth   = hooks.preAuth  || stub
    var postAuth  = hooks.postAuth || stub
    var onion = [
      whitelist, endpoint, pkg, help, version,
      preAuth, creds, welcome, auth, postAuth,
      discovery.resolve({ extras: true }), rollfore, space
    ]
    return function(){
      var argv = parse(arguments[arguments.length -1])
      skin({
        configuration: configuration,
        argv: argv,
        read: read
      }, onion)
    }
  }

  surge.cutover = function(hooks){
    var hooks = hooks || {}
    var preAuth   = hooks.preAuth  || stub
    var postAuth  = hooks.postAuth || stub
    var onion = [
      whitelist, endpoint, pkg, help, version,
      preAuth, creds, welcome, auth, postAuth,
      discovery.resolve({ extras: true }), cutover, space
    ]
    return function(){
      var argv = parse(arguments[arguments.length -1])
      skin({
        configuration: configuration,
        argv: argv,
        read: read
      }, onion)
    }
  }

  surge.discard = function(hooks){
    var hooks = hooks || {}
    var preAuth   = hooks.preAuth  || stub
    var postAuth  = hooks.postAuth || stub
    var onion = [
      whitelist, endpoint, pkg, help, version,
      preAuth, creds, welcome, auth, postAuth,
      discovery.resolve({ extras: true }), discard, space
    ]
    return function(){
      var argv = parse(arguments[arguments.length -1])
      skin({
        configuration: configuration,
        argv: argv,
        read: read
      }, onion)
    }
  }

  surge.bust = function(hooks){
    var hooks = hooks || {}
    var preAuth   = hooks.preAuth  || stub
    var postAuth  = hooks.postAuth || stub
    var onion = [
      whitelist, endpoint, pkg, help, version,
      preAuth, creds, welcome, auth, postAuth,
      discovery.resolve({ extras: true }), bust, space
    ]
    return function(){
      var argv = parse(arguments[arguments.length -1])
      skin({
        configuration: configuration,
        argv: argv,
        read: read
      }, onion)
    }
  }

  surge.analytics = function(hooks){
    var hooks = hooks || {}
    var preAuth   = hooks.preAuth  || stub
    var postAuth  = hooks.postAuth || stub
    var onion = [
      whitelist, endpoint, pkg, help, version,
      preAuth, creds, welcome, auth, postAuth,
      discovery.resolve({ extras: true }), analytics, space
    ]
    return function(){
      var argv = parse(arguments[arguments.length -1])
      skin({
        configuration: configuration,
        argv: argv,
        read: read
      }, onion)
    }
  }

  surge.traffic = function(hooks){
    var hooks = hooks || {}
    var preAuth   = hooks.preAuth  || stub
    var postAuth  = hooks.postAuth || stub
    var onion = [
      whitelist, endpoint, pkg, help, version,
      preAuth, creds, welcome, auth, postAuth,
      discovery.resolve({ extras: true }), traffic, space
    ]
    return function(){
      var argv = parse(arguments[arguments.length -1])
      skin({
        configuration: configuration,
        argv: argv,
        read: read
      }, onion)
    }
  }

  surge.load = function(hooks){
    var hooks = hooks || {}
    var preAuth   = hooks.preAuth  || stub
    var postAuth  = hooks.postAuth || stub
    var onion = [
      whitelist, endpoint, pkg, help, version,
      preAuth, creds, welcome, auth, postAuth,
      discovery.resolve({ extras: true }), load, space
    ]
    return function(){
      var argv = parse(arguments[arguments.length -1])
      skin({
        configuration: configuration,
        argv: argv,
        read: read
      }, onion)
    }
  }

  surge.audience = function(hooks){
    var hooks = hooks || {}
    var preAuth   = hooks.preAuth  || stub
    var postAuth  = hooks.postAuth || stub
    var onion = [
      whitelist, endpoint, pkg, help, version,
      preAuth, creds, welcome, auth, postAuth,
      discovery.resolve({ extras: true }), audience, space
    ]
    return function(){
      var argv = parse(arguments[arguments.length -1])
      skin({
        configuration: configuration,
        argv: argv,
        read: read
      }, onion)
    }
  }

  surge.usage = function(hooks){
    var hooks = hooks || {}
    var preAuth   = hooks.preAuth  || stub
    var postAuth  = hooks.postAuth || stub
    var onion = [
      whitelist, endpoint, pkg, help, version,
      preAuth, creds, welcome, auth, postAuth,
      discovery.resolve({ extras: true }), usage, space
    ]
    return function(){
      var argv = parse(arguments[arguments.length -1])
      skin({
        configuration: configuration,
        argv: argv,
        read: read
      }, onion)
    }
  }

  surge.files = function(hooks){
    var hooks = hooks || {}
    var preAuth   = hooks.preAuth  || stub
    var postAuth  = hooks.postAuth || stub
    var onion = [
      whitelist, endpoint, pkg, help, version,
      preAuth, creds, welcome, auth, postAuth,
      discovery.resolve({ extras: true }), files, space
    ]
    return function(){
      var argv = parse(arguments[arguments.length -1])
      skin({
        configuration: configuration,
        argv: argv,
        read: read
      }, onion)
    }
  }

  surge.audit = function(hooks){
    var hooks = hooks || {}
    var preAuth   = hooks.preAuth  || stub
    var postAuth  = hooks.postAuth || stub
    var onion = [
      whitelist, endpoint, pkg, help, version,
      preAuth, creds, welcome, auth, postAuth,
      discovery.resolve({ extras: true }), audit, space
    ]
    return function(){
      var argv = parse(arguments[arguments.length -1])
      skin({
        configuration: configuration,
        argv: argv,
        read: read
      }, onion)
    }
  }

  surge.select = function(hooks){
    var hooks = hooks || {}
    var preAuth   = hooks.preAuth  || stub
    var postAuth  = hooks.postAuth || stub
    var onion = [
      whitelist, endpoint, pkg, help, version,
      preAuth, creds, welcome, auth, postAuth, shorthand,
      select, space
    ]
    return function(){
      var argv = parse(arguments[arguments.length -1])
      skin({
        configuration: configuration,
        argv: argv,
        read: read
      }, onion)
    }
  }

  surge.status = function(hooks){
    var hooks = hooks || {}
    var preAuth   = hooks.preAuth  || stub
    var postAuth  = hooks.postAuth || stub
    var onion = [
      whitelist, endpoint, pkg, help, version, space,
      preAuth, creds, auth, postAuth,
      shorthand, discovery.resolve({ prompt: true }),
      status, space
    ]
    return function(){
      var argv = parse(arguments[arguments.length -1])
      skin({
        configuration: configuration,
        argv: argv,
        read: read
      }, onion)
    }
  }

  surge.teardown = function(hooks){
    var hooks = hooks || {}
    var preAuth   = hooks.preAuth  || stub
    var postAuth  = hooks.postAuth || stub
    var onion = [
      whitelist, endpoint, pkg, help, version, space,
      preAuth, creds, auth, postAuth,
      shorthand, discovery.resolve({ prompt: true }),
      teardown, space
    ]
    return function(){
      var argv = parse(arguments[arguments.length -1])
      skin({
        configuration: configuration,
        argv: argv,
        read: read
      }, onion)
    }
  }

  surge.plus = function(hooks){
    var hooks = hooks || {}
    var preAuth   = hooks.preAuth  || stub
    var postAuth  = hooks.postAuth || stub
    var onion = [
      whitelist, endpoint, pkg, help, version, space,
      preAuth, creds, welcome, tokencheck, email, auth, postAuth,
      shorthand, discovery.resolve({ prompt: true, log: true }),
      plus, space
    ]
    return function(){
      var argv = parse(arguments[arguments.length -1])
      skin({
        configuration: configuration,
        argv: argv,
        read: read
      }, onion)
    }
  }

  surge.plan = function(hooks){
    var hooks = hooks || {}
    var preAuth   = hooks.preAuth  || stub
    var postAuth  = hooks.postAuth || stub
    var onion = [
      whitelist, endpoint, pkg, help, version, space,
      preAuth, creds, welcome, auth, postAuth,
      weblinks,
      shorthand, discovery.setDomainFromArgs,
      plans, plan, exitifcurrentplan,
      payment, subscribe,
      space
    ]
    return function(){
      var argv = parse(arguments[arguments.length -1])
      skin({
        configuration: configuration,
        argv: argv,
        read: read
      }, onion)
    }
  }

  surge.card = function(hooks){
    var hooks = hooks || {}
    var preAuth   = hooks.preAuth  || stub
    var postAuth  = hooks.postAuth || stub
    var onion = [
      whitelist, endpoint, pkg, help, version, space,
      preAuth, creds, welcome, auth, postAuth,
      plans, card, setcard,
      space
    ]
    return function(){
      var argv = parse(arguments[arguments.length -1])
      skin({
        configuration: configuration,
        argv: argv,
        read: read
      }, onion)
    }
  }

  surge.nuke = function(hooks){
    var hooks = hooks || {}
    var preAuth   = hooks.preAuth  || stub
    var postAuth  = hooks.postAuth || stub
    var onion = [
      whitelist, endpoint, pkg, help, version,
      preAuth, creds, welcome, auth, postAuth,
      nuke, space
    ]
    return function(){
      var argv = parse(arguments[arguments.length -1])
      skin({
        configuration: configuration,
        argv: argv,
        read: read
      }, onion)
    }
  }

  surge.ssl = function(hooks){
    var hooks = hooks || {}
    var preAuth   = hooks.preAuth  || stub
    var postAuth  = hooks.postAuth || stub
    var onion = [
      whitelist, endpoint, pkg, help, version, space,
      preAuth, creds, auth, postAuth,
      shorthand, discovery.resolve({ prompt: true }),
      pemOrSilent, ssl, space
    ]
    return function(){
      var argv = parse(arguments[arguments.length -1])
      skin({
        configuration: configuration,
        argv: argv,
        read: read
      }, onion)
    }
  }

  surge.invite = function(hooks){
    var hooks = hooks || {}
    var preAuth   = hooks.preAuth  || stub
    var postAuth  = hooks.postAuth || stub
    var onion = [
      whitelist, endpoint, pkg, help, version, space,
      preAuth, creds, auth, postAuth,
      discovery.resolve({ extras: true }), invite, space
    ]
    return function(){
      var argv = parse(arguments[arguments.length -1])
      skin({
        configuration: configuration,
        argv: argv,
        read: read
      }, onion)
    }
  }

  surge.revoke = function(hooks){
    var hooks = hooks || {}
    var preAuth   = hooks.preAuth  || stub
    var postAuth  = hooks.postAuth || stub
    var onion = [
      whitelist, endpoint, pkg, help, version, space,
      preAuth, creds, auth, postAuth,
      discovery.resolve({ extras: true }), revoke, space
    ]
    return function(){
      var argv = parse(arguments[arguments.length -1])
      skin({
        configuration: configuration,
        argv: argv,
        read: read
      }, onion)
    }
  }

  surge.encrypt = function(hooks){
    var hooks = hooks || {}
    var preAuth   = hooks.preAuth  || stub
    var postAuth  = hooks.postAuth || stub
    var onion = [
      whitelist, endpoint, pkg, help, version, space,
      preAuth, creds, welcome, auth, authInfo, postAuth,
      discovery.resolve({ extras: true }), encrypt, space
    ]
    return function(){
      var argv = parse(arguments[arguments.length -1])
      skin({
        configuration: configuration,
        argv: argv,
        read: read
      }, onion)
    }
  }

  surge.certs = function(hooks){
    var hooks = hooks || {}
    var preAuth   = hooks.preAuth  || stub
    var postAuth  = hooks.postAuth || stub
    var onion = [
      whitelist, endpoint, pkg, help, version, space,
      preAuth, creds, auth, postAuth,
      discovery.resolve({ extras: true }), certs, space
    ]
    return function(){
      var argv = parse(arguments[arguments.length -1])
      skin({
        configuration: configuration,
        argv: argv,
        read: read
      }, onion)
    }
  }

  surge.config = function(hooks){
    var hooks = hooks || {}
    var preAuth   = hooks.preAuth  || stub
    var postAuth  = hooks.postAuth || stub
    var onion = [
      endpoint, pkg, help, version, space,
      preAuth, creds, auth, postAuth,
      discovery.resolve({ extras: true }), config, space
    ]
    return function(){
      var argv = parse(arguments[arguments.length -1])
      skin({
        configuration: configuration,
        argv: argv,
        read: read
      }, onion)
    }
  }

  // dns namespace - [<domain>] all•add•rem, bare = all. normalizes to
  // the legacy domain-first shape the dns middleware parses itself
  surge.dns = function(hooks){
    var hooks = hooks || {}
    var preAuth   = hooks.preAuth  || stub
    var postAuth  = hooks.postAuth || stub
    var onion = [
      whitelist, endpoint, pkg, help, version,
      preAuth, creds, auth, postAuth,
      dns("dns"), space
    ]
    return function(){
      var argv = parse(arguments[arguments.length -1])
      var verbs = ["all", "add", "rem"]
      var a0 = argv._[0] != null ? String(argv._[0]) : null

      // infer the domain when the verb leads or nothing is given
      if (!a0 || verbs.indexOf(a0) !== -1){
        var local = discovery.local()
        if (!local){
          if (!a0) return help.dnsUsage(configuration.name)
          helpers.space()
          helpers.trunc("Aborted".yellow + " - No domain found - pass a domain or publish first.".grey)
          helpers.space()
          return process.exit(1)
        }
        argv._.unshift(local.domain)
      }

      // "all" is the bare read in the legacy shape
      if (argv._[1] != null && String(argv._[1]) === "all") argv._.splice(1, 1)

      skin({
        configuration: configuration,
        argv: argv,
        read: read
      }, onion)
    }
  }

  surge.zone = function(hooks){
    var hooks = hooks || {}
    var preAuth   = hooks.preAuth  || stub
    var postAuth  = hooks.postAuth || stub
    var onion = [
      whitelist, endpoint, pkg, help, version,
      preAuth, creds, auth, postAuth,
      dns("zone"), space
    ]
    return function(){
      var argv = parse(arguments[arguments.length -1])
      skin({
        configuration: configuration,
        argv: argv,
        read: read
      }, onion)
    }
  }

  // pulls the verb out of a noun's argv - the verb may lead or follow
  // the [<domain>] slot. returns the default verb for bare/domain-only
  // input, null when a bare call has no local domain (show usage), and
  // exits on a first arg that is neither verb, domain, nor path.
  var namespaceVerb = function(argv, verbs, label, dflt){
    var a0 = argv._[0] != null ? String(argv._[0]) : null
    var a1 = argv._[1] != null ? String(argv._[1]) : null

    if (a0 && verbs.indexOf(a0) !== -1){
      argv._.shift()
      return a0
    }
    if (a1 && verbs.indexOf(a1) !== -1){
      argv._.splice(1, 1)
      return a1
    }
    if (!a0) return discovery.local() ? dflt : null
    if (helpers.validDomain(a0) || a0.indexOf("/") !== -1 || a0.indexOf(".") === 0 || fs.existsSync(a0)){
      return dflt
    }
    helpers.space()
    helpers.trunc("Aborted".yellow + (" - `" + a0 + "` is not a " + configuration.name + " " + label + " command. Try `" + configuration.name + " --help`.").grey)
    helpers.space()
    return process.exit(1)
  }

  surge.revs = function(hooks){
    var hooks = hooks || {}
    var preAuth   = hooks.preAuth  || stub
    var postAuth  = hooks.postAuth || stub
    var onion = [
      whitelist, endpoint, pkg, help, version, space,
      preAuth, creds, welcome, auth, postAuth,
      discovery.resolve({ extras: true }), list, space
    ]
    return function(){
      var argv = parse(arguments[arguments.length -1])
      skin({
        configuration: configuration,
        argv: argv,
        read: read
      }, onion)
    }
  }

  // debug namespace - [<domain>] status•files•audit•bust•certs•encrypt,
  // bare = status
  surge.debug = function(hooks){
    var verbs = ["status", "files", "audit", "bust", "certs", "encrypt"]
    return function(){
      var argv = parse(arguments[arguments.length -1])
      var verb = namespaceVerb(argv, verbs, "debug", "status")
      if (verb === null) return help.debugUsage(configuration.name)
      return surge[verb](hooks || {})(argv)
    }
  }

  // stats namespace - [<domain>] traffic•load•audience•usage, bare = the
  // analytics overview
  surge.stats = function(hooks){
    var verbs = ["traffic", "load", "audience", "usage"]
    return function(){
      var argv = parse(arguments[arguments.length -1])
      var verb = namespaceVerb(argv, verbs, "stats", "analytics")
      if (verb === null) return help.statsUsage(configuration.name)
      return surge[verb](hooks || {})(argv)
    }
  }

  // account namespace - whoami•login•logout•verify•card•nuke, bare = the
  // account panel
  surge.account = function(hooks){
    var hooks = hooks || {}
    var verbs = ["whoami", "login", "logout", "verify", "card", "nuke"]
    var preAuth   = hooks.preAuth  || stub
    var postAuth  = hooks.postAuth || stub
    var onion = [
      whitelist, endpoint, pkg, help, version, space,
      preAuth, creds, auth, postAuth,
      account, space
    ]
    return function(){
      var argv = parse(arguments[arguments.length -1])
      var verb = argv._[0] != null ? String(argv._[0]) : null

      if (verb && verbs.indexOf(verb) !== -1){
        argv._.shift()
        return surge[verb](hooks)(argv)
      }

      if (verb){
        helpers.space()
        helpers.trunc("Aborted".yellow + (" - `" + verb + "` is not a " + configuration.name + " account command. Try `" + configuration.name + " --help`.").grey)
        helpers.space()
        return process.exit(1)
      }

      skin({
        configuration: configuration,
        argv: argv,
        read: read
      }, onion)
    }
  }

  return surge

}
