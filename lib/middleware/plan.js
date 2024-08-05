
var url         = require("url")
var helpers     = require("../util/helpers")
var path        = require("path")
var fs          = require("fs")
var os          = require("os")
var prompts     = require("prompts")
var tables      = require("../util/tables")

module.exports = function(req, next, abort){
  
  var choice = function(plan){
    plan.metadata.regions = plan.metadata.regions || ""

    var price   = plan.amount.toString().substring(0, plan.amount.toString().length - 2)

    var shortinter = plan.interval == "year" 
      ? "yr" 
      : "mo"

    var title = plan.name

    // add price
    if (price == "00") {
      title += " Free"
    }else{
      title += " $" + price + "/" + shortinter 
    }

    if (plan.current == true){
      title += "  " + " ★ ★ CURRENT ★ ★ ".inverse
      if (plan.comped){
        title += " (comped by surge)"
      }
    } else {
      if (plan.trial_period_days){
        title += " (" + plan.trial_period_days + " day trial)"
      }
    }

    var features = [title].concat(plan.perks || [])

    return {
      value: plan,
      //title: "   " + features.join("\n       - ") + "\n",
      title: plan.name,
      //plan: plan
    }
  }

  var indexOfCurrent = 0
  for (var i in req.plans.list){
    if (req.plans.list[i].current == true)
      indexOfCurrent = parseInt(i)
  }

  var choices = req.plans.list.map(choice)

  // var args = {
  //   type: 'list',
  //   name: 'plan',
  //   default: indexOfCurrent,
  //   choices: choices,
  //   pageSize: 30,
  //   separator: true
  // }

  // use message if the server gives us one
  // args.message = req.plans.message ? (" "  + req.plans.message.yellow + "\n") : ' '
  //args.message = ' '
  // prompt user to choose a plan



  var questions = {
    type: 'select',
    name: 'plan',
    message: 'Select a Plan',
    initial: indexOfCurrent,
    choices: choices
  }

  //console.log(choices)

  // prompts(questions, { onCancel: new Function, onSubmit: new Function }, function(a,b,c){
  //   console.log()
  //   console.log()
  //   console.log(a)
  //   console.log()
  //   console.log(b)
  //   console.log()
  //   console.log(c)
  //   console.log()
  // })

  var table = tables.plans(choices)
  var rows = table.toString().split("\n")
  rows.forEach(function(row, i){
    helpers.trunc(row.grey)
  })
  helpers.space()

  ;(async () => {
    const response = await prompts({
      type: 'select',
      name: 'plan',
      message: 'Select Account Plan',
      initial: indexOfCurrent,
      choices: choices
    }, { 
      
      onCancel: function(resp){
        console.log()
      }, 
      
      onSubmit: function(resp){
        console.log()
      }

    });

    if (response.plan){
      if (response.plan.comped){
        helpers.gap()
        helpers.trunc(" Done".green  + (" - On " + response.plan.name + " plan, free of charge.").grey)
        helpers.space()
        process.exit()
      }else{
        req.selectedPlan = response.plan
        var p = req.selectedPlan.id.split("-")[0]
        req.plan = p.charAt(0).toUpperCase() + p.slice(1)
        return next()
      }
    }else{
      helpers.trunc(" Aborted".yellow  + (" - No plan selected.").grey)
      helpers.space()
    }

  })();



  // inquirer.prompt([args]).then(function (answers) {
  //   helpers.gap()
  //   if (answers.plan.comped){
  //     helpers.trunc(" Done".green  + (" - On " + answers.plan.name + " plan, free of charge.").grey)
  //     helpers.space()
  //     process.exit()
  //   }
  //   req.selectedPlan = answers.plan
  //   var p = req.selectedPlan.id.split("-")[0]
  //   req.plan = p.charAt(0).toUpperCase() + p.slice(1)
  //   return next()
  // })


}
