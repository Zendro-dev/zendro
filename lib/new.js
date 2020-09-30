const {promisify} = require('util')
const figlet = promisify(require('figlet'))
const {log, spawn_console, clone} = require('../helper')

/**
 * Generate graphql-server code.
 * @param {string} name new project name
 * @param {object} options the options, e.g. keep docker files
 */
module.exports = async (name, options) => {
    const dockerize = options.dockerize
    const update = options.update_code_generators

    const welcome = await figlet(`Welcome To Zendro!`)
    log('Create new Zendro Project.')
    // clone Starter Pack repo
    await(clone('github:Zendro-dev/ScienceDbStarterPack', `./${name}`))

    log('Setup')
    await(spawn_console('bash', ['./setup.sh'], {cwd:`./${name}`}))
    await(spawn_console('cp', ['-r', './seeders', './graphql-server'], {cwd:`./${name}`}))
    
    // remove docker files by default 
    if (!dockerize){
        log('Remove Docker files.')  
        await(spawn_console('rm', ['initUserDb.sh'], {cwd:`./${name}`}))
        await(spawn_console('find', ['.', '-name', '*ocker*', '-type', 'f', '-delete'], 
        {cwd:`./${name}`}))
    }

    // update code generators if necessary
    if (update){
        log('Update Code Generators.')  
        await(spawn_console('npm', ['update', 'graphql-server-model-codegen']))
        await(spawn_console('npm', ['update', 'single-page-app-codegen']))         
    }

    // create log directory
    await(spawn_console('mkdir', ['./logs'], {cwd:`./${name}`}))
    
    log(welcome) 
    log('Hints: Please edit the following config files if necessary: \n' +
    './graphql-server/config/data_models_storage_config.json \n' + 
    './graphql-server/config/globals.js \n' +
    './single-page-app/src/config/globals.js \n'+
    './graphiql-auth/src/config/globals.js')
}