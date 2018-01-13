
var request     = require("request")
var url         = require("url")
var helpers     = require("./util/helpers")
var path        = require("path")
var fs          = require("fs")
var os          = require("os")
var inquirer    = require('inquirer')

module.exports = function(req, next, abort){
  
  var choice = function(plan){
    plan.metadata.regions = plan.metadata.regions || ""

    var price   = plan.amount.toString().substring(0, plan.amount.toString().length - 2)

    var shortinter = plan.interval == "year" 
      ? "yr" 
      : "mo"

    var title = plan.name.underline

    // add price
    if (price == "00") {
      title += " Free"
    }else{
      title += " $" + price + "/" + shortinter 
    }

    if (plan.current == true){
      title += "  [ ★ ★ CURRENT ★ ★ ]"
    } else {
      if (plan.trial_period_days){
        title += " (" + plan.trial_period_days + " day trial)"
      }
    }

    var features = [title].concat(plan.perks || [])

    return {
      short: " ",
      value: plan,
      name: "   " + features.join("\n     - ") + "\n"
    }
  }

  var choices = req.plans.list.map(choice)

  var args = {
    type: 'list',
    name: 'plan',
    choices: choices,
    pageSize: 30,
    separator: true
  }

  // use message if the server gives us one
  args.message = req.plans.message
    ? (req.plans.message.yellow + "\n")
    : ' '
  
  // prompt user to choose a plan
  inquirer.prompt([args]).then(function (answers) {
    req.selectedPlan = answers.plan
    var p = req.selectedPlan.id.split("-")[0]
    req.plan = p.charAt(0).toUpperCase() + p.slice(1)
    return next()
  })

}
