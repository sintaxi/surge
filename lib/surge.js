
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
var plan            = require("./middleware/plan")
var card            = require("./middleware/_shared/_card")
var ssl             = require("./middleware/ssl")
var rollback        = require("./middleware/rollback")
var rollfore        = require("./middleware/rollfore")
var cutover         = require("./middleware/cutover")
var bust            = require("./middleware/bust")
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
      "deploy",
      "teardown",
      "status",
      "token",
      "tokens",
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
      "usage",
      "traffic",
      "load",
      "audience",
      "nuke",
      ]

    // verbs that operate on a <proj> target (domain | path | cwd)
    var targetable = [
      "publish", "config", "revs", "rollback", "rollfore", "cutover",
      "discard", "invite", "revoke", "teardown", "dns", "debug", "stats",
      "list", "ssl", "zone",
      "status", "files", "audit", "bust", "certs", "encrypt",
      "traffic", "load", "audience", "usage"
    ]

    // the old top-level forms keep working forever - one grey line
    // points at their target-first home. ssl, zone, and token stay
    // silent: hidden capabilities, not deprecations.
    //
    // the identity verbs are NOT here on purpose. a namespace earns its
    // keep by grouping verbs under a target, and these have none - they
    // say who is typing, not what to do to a project. flat is their home,
    // so `surge account whoami` dispatches silently rather than nudging
    // anyone back and forth between two spellings.
    var nudges = {
      status:    "debug status",
      files:     "debug files",
      audit:     "debug audit",
      bust:      "debug bust",
      certs:     "debug certs",
      encrypt:   "debug encrypt",
      traffic:   "stats traffic",
      load:      "stats load",
      audience:  "stats audience",
      usage:     "stats usage"
    }

    // flags that state publish intent: a domain to publish to, or a
    // modifier that has no meaning outside publish. a domain given as
    // `-d example.com` is intent exactly like the positional pair, so
    // these route to publish rather than to the verbless overview.
    var publishIntent = function(){
      return !!(argv.domain || argv.project || argv.stage ||
                argv.message || argv.add || argv.remove || argv.build)
    }

    var isDomainish = function(s){
      return s.indexOf("@") === -1 && helpers.validDomain(s)
    }
    var isForcedPath = function(s){
      return s === "." || s === ".." || s.indexOf("./") === 0 || s.indexOf("../") === 0 ||
             s.indexOf("/") === 0 || s.indexOf("~") === 0
    }
    var isPathish = function(s){
      return isForcedPath(s) || fs.existsSync(s)
    }

    var abort = function(msg){
      helpers.space()
      helpers.trunc("Aborted".yellow + (" - " + msg).grey)
      helpers.space()
      return process.exit(1)
    }

    var nudgeLine = function(typed, now){
      helpers.space()
      helpers.trunc(("`" + configuration.name + " " + typed + "` is now `" + configuration.name + " " + now + "`").grey)
    }

    // verb-first: the target is implied (cwd) - unless a domain or path
    // follows in the legacy order, which parses forever and nudges
    if (cmd && commands.indexOf(cmd) !== -1) {
      argv._.shift()
      var nudge = nudges[cmd]
      var t = argv._[0] != null ? String(argv._[0]) : null
      var legacyTarget = t && cmd !== "publish" && cmd !== "deploy" && targetable.indexOf(cmd) !== -1 && (isDomainish(t) || isPathish(t)) ? t : null
      // what the user typed is echoed back from cmd plus the target, so a
      // form told apart by a SUBCOMMAND needs to carry it too. bare `surge
      // token` still prints the token in use, so quoting it here would point
      // a read at `tokens add`, which mints a new credential every time.
      var typedSub = null
      if (cmd === "token" && (t === "add" || t === "rem")){
        nudge = "tokens " + t
        typedSub = t
      }
      if (cmd === "list" && legacyTarget) nudge = "revs"
      if (nudge || legacyTarget){
        var typed = cmd + (legacyTarget ? " " + legacyTarget : "") + (typedSub ? " " + typedSub : "")
        var now = (legacyTarget ? legacyTarget + " " : "") + (nudge || cmd)
        nudgeLine(typed, now)
      }
      return surge[cmd]({})(argv)
    }

    // plus was the per-project plan - retired in favour of account plans
    if (cmd === "plus"){
      return abort("the Plus plan is legacy. Manage your plan with `" + configuration.name + " plan`.")
    }

    // library consumers may route anything unrecognized to one command
    if (configuration.default && commands.indexOf(configuration.default) !== -1){
      return surge[configuration.default]({})(argv)
    }

    // target-first: surge <proj> <verb> [args]
    if (cmd){
      var domainT = !isForcedPath(cmd) && isDomainish(cmd)
      var pathT   = !domainT && isPathish(cmd)

      if (domainT || pathT){
        var verb = argv._[1] != null ? String(argv._[1]) : null

        // the publish pair - surge <path> <domain>, where `_` asks for a
        // generated domain with no prompt
        if (pathT && verb && (isDomainish(verb) || verb === "_")){
          return surge.publish({})(argv)
        }

        // surge <path> publish - the constructor, no project required yet.
        // publish takes a path, never a domain - a domain has nothing to
        // upload; the pair covers publishing the cwd to a domain.
        // deploy is a silent alias for publish.
        if (verb === "publish" || verb === "deploy"){
          if (domainT){
            return abort(verb + " takes a path - try `" + configuration.name + " <path> " + cmd + "`.")
          }
          argv._.splice(1, 1)
          return surge.publish({})(argv)
        }

        // a path target carrying publish-intent flags is a publish -
        // `surge ./dist -d example.com` states its domain, and
        // --preview/-m/--build mean nothing anywhere else
        if (pathT && !verb && publishIntent()){
          return surge.publish({})(argv)
        }

        // verbless never acts - overview in a terminal (even for a
        // directory that is not a project yet - the help carries the
        // note), loud in a pipeline
        if (!verb){
          return skin({
            configuration: configuration,
            argv: argv,
            read: read
          }, [whitelist, pkg, function(req, next){
            if (!process.stdout.isTTY && !req.argv.help && !req.argv.h){
              var hint = domainT
                ? "`" + configuration.name + " <path> " + cmd + "`"
                : "`" + configuration.name + " " + cmd + " publish`"
              console.error(configuration.name + ": nothing to do - try " + hint + " or `" + configuration.name + " " + cmd + " <command>`")
              return process.exit(1)
            }
            req.argv.help = true
            return help(req, function(){})
          }])
        }

        // a verb against a path target requires a surge project
        if (pathT && !discovery.local(cmd)){
          if (!fs.existsSync(cmd)) return abort("`" + cmd + "` - no such directory.")
          return abort("`" + cmd + "` is not a surge project - publish first or pass a domain.")
        }

        if (commands.indexOf(verb) !== -1 && targetable.indexOf(verb) !== -1){
          argv._.splice(1, 1)
          if (nudges[verb]) nudgeLine(cmd + " " + verb, cmd + " " + nudges[verb])
          return surge[verb]({})(argv)
        }

        if (commands.indexOf(verb) !== -1){
          return abort("`" + verb + "` does not take a project - try `" + configuration.name + " " + verb + "`.")
        }

        return abort("`" + verb + "` is not a surge command. Try `" + configuration.name + " --help`.")
      }

      // publish flags mean the positional was meant as a project path,
      // so let publish report it missing rather than calling a failed
      // build directory a bad command
      if (publishIntent()) return surge.publish({})(argv)

      return abort("`" + cmd + "` is not a surge command. Try `" + configuration.name + " --help`.")
    }

    // flag-style publish (CI: surge -p ./dist -d example.com, or bare
    // flags against the cwd: surge --preview)
    if (publishIntent()){
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
      console.error("surge requires a path - try `surge <path> <domain>` or `surge --help`")
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

      if (verb === null) return help.tokensUsage(configuration.name)

      if (verb === "add" || verb === "rem") return surge.token(hooks)(argv)

      // list is the read verb everywhere - all stays a silent alias
      if (verb !== "list" && verb !== "all"){
        helpers.space()
        helpers.trunc("Aborted".yellow + (" - `" + verb + "` is not a " + configuration.name + " tokens command. Try `" + configuration.name + " --help`.").grey)
        helpers.space()
        return process.exit(1)
      }

      argv._.shift()
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
      var verbs = ["list", "all", "add", "rem"]
      var a0 = argv._[0] != null ? String(argv._[0]) : null

      // bare noun shows its usage - rendered against the cwd
      if (!a0) return help.dnsUsage(configuration.name, discovery.local(), null)

      if (verbs.indexOf(a0) !== -1){
        // verb leads - the target is the cwd
        var local = discovery.local()
        if (!local){
          helpers.space()
          helpers.trunc("Aborted".yellow + " - No domain found - pass a domain or publish first.".grey)
          helpers.space()
          return process.exit(1)
        }
        argv._.unshift(local.domain)
      } else {
        // <proj> leads - resolve it, exiting when a path is no project
        var ctx = targetContext(a0)
        argv._[0] = ctx.domain

        // verbless never acts - usage against the typed target
        if (argv._[1] == null){
          return help.dnsUsage(configuration.name, ctx, a0)
        }
        if (verbs.indexOf(String(argv._[1])) === -1){
          helpers.space()
          helpers.trunc("Aborted".yellow + (" - `" + String(argv._[1]) + "` is not a " + configuration.name + " dns command. Try `" + configuration.name + " --help`.").grey)
          helpers.space()
          return process.exit(1)
        }
      }

      // list (and its silent alias all) is the bare read in the legacy shape
      if (argv._[1] != null && (String(argv._[1]) === "list" || String(argv._[1]) === "all")) argv._.splice(1, 1)

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

  // target-first namespace parse: [<proj>] <verb>. no verb means usage -
  // verbless never acts. garbage that is neither verb, domain, nor path
  // exits loudly.
  var namespaceParse = function(argv, verbs, label){
    var a0 = argv._[0] != null ? String(argv._[0]) : null
    var a1 = argv._[1] != null ? String(argv._[1]) : null

    if (a0 && verbs.indexOf(a0) !== -1){
      argv._.shift()
      return { verb: a0 }
    }
    if (a1 && verbs.indexOf(a1) !== -1){
      argv._.splice(1, 1)
      return { verb: a1 }
    }
    if (a0 && !helpers.validDomain(a0) && a0.indexOf("/") === -1 && a0.indexOf(".") !== 0 && !fs.existsSync(a0)){
      helpers.space()
      helpers.trunc("Aborted".yellow + (" - `" + a0 + "` is not a " + configuration.name + " " + label + " command. Try `" + configuration.name + " --help`.").grey)
      helpers.space()
      return process.exit(1)
    }
    return { usage: true, typed: a0 }
  }

  // resolves a typed target for a usage screen - a domain is itself, a
  // path must be a surge project, nothing typed falls back to the cwd
  var targetContext = function(typed){
    if (!typed) return discovery.local()
    if (typed.indexOf("@") === -1 && helpers.validDomain(typed) &&
        !(typed === "." || typed === ".." || typed.indexOf("./") === 0 || typed.indexOf("../") === 0 || typed.indexOf("/") === 0)){
      return { domain: typed, source: "arg" }
    }
    var found = discovery.local(typed)
    if (!found){
      var msg = fs.existsSync(typed)
        ? "`" + typed + "` is not a surge project - publish first or pass a domain."
        : "`" + typed + "` - no such directory."
      helpers.space()
      helpers.trunc("Aborted".yellow + (" - " + msg).grey)
      helpers.space()
      return process.exit(1)
    }
    return { domain: found.domain, source: found.source, at: typed }
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

  // debug namespace - [<proj>] status·files·audit·bust·certs·encrypt
  surge.debug = function(hooks){
    var verbs = ["status", "files", "audit", "bust", "certs", "encrypt"]
    return function(){
      var argv = parse(arguments[arguments.length -1])
      var parsed = namespaceParse(argv, verbs, "debug")
      if (parsed.usage) return help.debugUsage(configuration.name, targetContext(parsed.typed), parsed.typed)
      return surge[parsed.verb](hooks || {})(argv)
    }
  }

  // stats namespace - [<proj>] traffic·load·audience·usage
  surge.stats = function(hooks){
    var verbs = ["traffic", "load", "audience", "usage"]
    return function(){
      var argv = parse(arguments[arguments.length -1])
      var parsed = namespaceParse(argv, verbs, "stats")
      if (parsed.usage) return help.statsUsage(configuration.name, targetContext(parsed.typed), parsed.typed)
      return surge[parsed.verb](hooks || {})(argv)
    }
  }

  // account namespace - whoami·login·logout·verify·card·plan·nuke,
  // bare = usage. `surge plan` stays a silent alias - never nudge the
  // money path.
  surge.account = function(hooks){
    var hooks = hooks || {}
    var verbs = ["whoami", "login", "logout", "verify", "card", "plan", "nuke"]
    return function(){
      var argv = parse(arguments[arguments.length -1])
      var verb = argv._[0] != null ? String(argv._[0]) : null

      if (verb === null) return help.accountUsage(configuration.name)

      if (verbs.indexOf(verb) !== -1){
        argv._.shift()
        return surge[verb](hooks)(argv)
      }

      helpers.space()
      helpers.trunc("Aborted".yellow + (" - `" + verb + "` is not a " + configuration.name + " account command. Try `" + configuration.name + " --help`.").grey)
      helpers.space()
      return process.exit(1)
    }
  }

  // deploy is a silent alias for publish - the vocabulary word stays
  // publish everywhere user-visible
  surge.deploy = surge.publish

  return surge

}
