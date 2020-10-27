const {log, spawn_string, spawn_console} = require('../helper')

/**
 * Stop Zendro App.
 * @param {... string} service service name
 */
module.exports = async (service) => {
    // stop all service by default
    if (!service.length){
        service = ['gqs', 'spa', 'giql']
        log('stop all service: ' + service+' \n')
    }

    for (let serv of service){
        let name = ''
        let regular_exp = ''
        // filter PID by regular expression
        if (serv === 'gqs'){
            name = 'graphql-server'
            regular_exp = '[0-9] node server.js'
        } else if (serv == 'spa'){
            name = 'single-page-app'
            regular_exp = '[0-9] node .*single-page-app.*js'
           
        } else if (serv == 'giql'){
            name = 'graphiQL'
            regular_exp = '[0-9] node .*graphiql.*js'

        } else {
            log('No such service, please check your input:' + serv)
            continue
        }

        let PID = parseInt(await spawn_string('ps', ['-aef'], 'grep', [regular_exp],
        'awk', ['{print $2}']))
        if (isNaN(PID)){
            log(`${name} is not running, please check\n`)
        } else{
            log(`stop ${name}, PID: ${PID}\n`)
            spawn_console('kill', ['-9', PID])
        }
    }
    log('Hint: log files are in the folder: ' + process.cwd() + '/logs \n')
}