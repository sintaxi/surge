var helpers = require("./util/helpers.js");

module.exports = function(req, next) {
  helpers.trunc(
    "\nAll the above domains will be removed. Do you want to continue? (y/n) \n"
  );
  helpers.read(
    {
      silent: false,
      default: "",
      edit: true,
      output: req.argv._[0],
      input: req.argv._[0]
    },
    function(err, option) {
      if (["y", "yes"].includes(option.toLowerCase())) {
        next();
      } else {
        helpers.trunc("Aborted".yellow + " - Unable to remove.".grey);
        process.exit(1);
      }
    }
  );
};
