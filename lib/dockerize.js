 const {spawn_console, log} = require('../helper')
 const fs = require('fs').promises

/**
 * Dockerize Zendro App.
 */
module.exports = async (options) => {
    const up = options.up
    const down = options.down
    if (up){
        const path = process.cwd()+'/graphql-server/config/data_models_storage_config.json'

        // make sure the host of Postgres is the service name in docker-compose-dev.yml
        const data = await(fs.readFile(path))
        obj = JSON.parse(data)
        obj['default-sql'].host = 'sdb_postgres'
        json = JSON.stringify(obj, null, 2)
        await(fs.writeFile(path, json))
    
        // dockerize Zendro App
        await(spawn_console('sudo', ['docker-compose', '-f', 'docker-compose-dev.yml', 'up', 
        '--force-recreate', '--remove-orphans'], {cwd:process.cwd()}))    
    } else if (down){
        await(spawn_console('docker-compose', ['down', '--remove-orphans'], {cwd:process.cwd()}))
    } else {
        log('Please specify an option: -u or -d')
    }
}