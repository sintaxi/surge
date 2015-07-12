
module.exports = {
    defaults: {
        endpoint: 'https://surge.sh'
    },
    login: require('./methods/login.js'),
    logout: require('./methods/logout.js'),
    whoami: require('./methods/whoami.js'),
    deploy: require('./methods/deploy.js'),
}
