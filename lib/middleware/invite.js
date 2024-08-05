
var helpers = require("../util/helpers.js")
var surgeSDK = require("surge-sdk")

module.exports = function(req, next){

  var sdk = surgeSDK({
    endpoint: req.endpoint.format(),
    defaults: helpers.defaults
  })

  var args = helpers.parseDomainsEmails(req.argv["_"])

  // helpers.displayInvites({ 
  //   invites: [ 
  //     { 
  //       domain: 'test.lvh.me',
  //       email: 'brock@sintaxi.com',
  //       invite: 'surge.lvh.me/invite/19d7e810-493b-4b9c-8020-46e7c3712028',
  //       status: 'success' 
  //     },
  //     { 
  //       domain: 'test.lvh.me',
  //       email: 'brock@sintaxi.com',
  //       invite: 'surge.lvh.me/invite/19d7e810-493b-4b9c-8020-46e7c3712028',
  //       status: 'success' 
  //     },
  //     { 
  //       domain: 'test.lvh.me',
  //       email: 'brock@sintaxi.com',
  //       invite: 'surge.lvh.me/invite/19d7e810-493b-4b9c-8020-46e7c3712028',
  //       status: 'success' 
  //     }  
  //   ],
  //   status: 202 
  // })

  sdk.invite(args.domains[0] || null, args, { user: "token", pass: req.creds.token }, function(error, rsp){
    if (error) {
      helpers.space()
      process.exit(1)
    } else {
      helpers.displayInvites(rsp)
      return next()
    }
  })

}
