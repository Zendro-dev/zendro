const {log, spawn_log} = require('../helper')
const fs = require('fs')
// const gqs_globals = require(process.cwd()+'/graphql-server/config/globals')
// const spa_globals = require(process.cwd()+'/single-page-app/src/config/globals')
// const giql_globals = require(process.cwd()+'/graphiql-auth/src/config/globals')

/**
 * Start Zendro App.
 * @param {... string} service service name
 * @param {object} options the options, e.g. install packages
 */
module.exports = async (service, options) => {
    const install = options.install_package
    const path = process.cwd()+'/graphql-server/config/data_models_storage_config.json'

    // make sure the host of Postgres is localhost
    const data = await(fs.promises.readFile(path))
    obj = JSON.parse(data)
    obj['default-sql'].host = '127.0.0.1'
    json = JSON.stringify(obj, null, 2)
    await(fs.promises.writeFile(path, json))

    // start all service by default
    if (!service.length){
        service = ['gqs', 'spa', 'giql']
        log('start all service: ' + service+' \n')
    }
    for (let serv of service){
        if (serv === 'gqs'){
            let log_gqs = fs.openSync(process.cwd()+'/logs/graphql-server.log', 'w')
            // install packages if necessary
            if (install){
                log('install graphql-server packages \n')
                await(spawn_log(false, 'npm', ['install'], {
                    detached: true,
                    stdio: ['ignore', log_gqs, log_gqs],
                    cwd:process.cwd()+'/graphql-server'
                }))
            }

            let gqs_env = Object.create(process.env)
            // set up the port of graphql-server
            gqs_env.PORT = 3000
            log('start graphql-server, PORT: '+gqs_env.PORT +' \n')

            spawn_log(true, 'bash', ['./migrateDbAndStartServer.sh'], {
                detached: true,
                stdio: ['ignore', log_gqs, log_gqs],
                cwd: process.cwd()+'/graphql-server',
                env: gqs_env
            })

        } else if (serv == 'spa'){
            let log_spa = fs.openSync(process.cwd()+'/logs/single-page-app.log', 'w')
            // install packages if necessary
            if (install){
                log('install single-page-app packages \n')
                await(spawn_log(false, 'npm', ['install'], {
                    detached: true,
                    stdio: ['ignore', log_spa, log_spa],
                    cwd:process.cwd()+'/single-page-app'
                }))             
            }

            let spa_env = Object.create(process.env)
            // set up the port of single-page-app
            spa_env.PORT = 8080
            log('start single-page-app, PORT: '+spa_env.PORT+' \n')

            spawn_log(true, 'npm', ['start'], {
                detached: true,
                stdio: [process.stdin, log_spa, log_spa],
                cwd: process.cwd()+'/single-page-app',
                env: spa_env
            })

        } else if (serv == 'giql'){
            // install packages if necessary
            let log_giql = fs.openSync(process.cwd()+'/logs/graphiql.log', 'w')
            if (install){
                log('install graphiQL packages \n')
                await(spawn_log(false, 'npm', ['install'], {
                    detached: true,
                    stdio: ['ignore', log_giql, log_giql],
                    cwd:process.cwd()+'/graphiql-auth'
                }))           
            }

            let giql_env = Object.create(process.env)
            // set up the port of graphiQL
            giql_env.PORT = 7000
            log('start graphiQL, PORT: '+giql_env.PORT+' \n')

            spawn_log(true, 'npm', ['start'], {
                detached: true,
                stdio: ['ignore', log_giql, log_giql],
                cwd: process.cwd()+'/graphiql-auth',
                env: giql_env
            })

        } else {
            log('No such service, please check your input.')
        }
    }
    log('Hint: log files are in the folder: ' + process.cwd() + '/logs \n')
    
}