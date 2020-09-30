 const {spawn_console} = require('../helper')
 const fs = require('fs/promises')

/**
 * Dockerize Zendro App.
 */
module.exports = async () => {
    const path = process.cwd()+'/graphql-server/config/data_models_storage_config.json'

    // make sure the host of Postgres is the service name in docker-compose-dev.yml
    const data = await(fs.readFile(path))
    obj = JSON.parse(data)
    obj['default-sql'].host = 'sdb_postgres'
    json = JSON.stringify(obj, null, 2)
    await(fs.writeFile(path, json))

    // dockerize Zendro App
    await(spawn_console('docker-compose', ['-f', 'docker-compose-dev.yml', 'up', 
    '--force-recreate', '--remove-orphans'], {cwd:process.cwd()}))
}