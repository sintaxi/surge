module.exports = function(req, next){
  console.log('         IP address:'.grey, "192.241.214.148")
  console.log('             status:'.grey, "deployed and live.")
  console.log("")

  // console.log('      Report Card...')
  // console.log('')
  // console.log('                css:'.grey, "C".yellow)
  // console.log('             images:'.grey, "B-".green)
  // console.log('            scripts:'.grey, "A".green)
  // console.log("")
  next()
}