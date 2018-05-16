var request = require("request");
var url = require("url");
var helpers = require("./util/helpers");
var path = require("path");
var parseUrl = require("url-parse-as-address");

module.exports = function(req, next, abort) {
  var options = {
    url: url.resolve(req.endpoint.format(), "/list"),
    method: "get",
    auth: {
      user: "token",
      pass: req.creds.token,
      sendImmediately: true
    }
  };

  request(options, function(e, r, obj) {
    if (e) throw e;
    var list = JSON.parse(obj);
    return list.map(item => {
      remove(parseUrl(item.domain).host);
    });
  });

  var remove = function(domain) {
    var options = {
      url: url.resolve(req.endpoint, domain),
      method: "delete",
      auth: {
        user: "token",
        pass: req.creds.token,
        sendImmediately: true
      }
    };

    request(options, function(e, r, obj) {
      if (e) throw e;

      if (r.statusCode == 200 || r.statusCode == 204 || r.statusCode == 210) {
        helpers.space();
        helpers.trunc(
          "Success".green +
            (" - " + domain.underline + " has been removed.").grey
        );
        helpers.space();
      } else if (r.statusCode == 403) {
        helpers.space();
        helpers.trunc(
          "Aborted".yellow +
            (" - Unable to remove " + domain.underline + ".").grey
        );
        helpers.space();
      } else {
        helpers.space();
        helpers.log(obj);
        helpers.space();
        process.exit();
      }
    });
  };
};
