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

    const welcome = await figlet(`Welcome To Zendro!`)
    log('Create new Zendro Project.')
    // clone Starter Pack repo
    await(clone('github:Zendro-dev/ScienceDbStarterPack', `./${name}`))

    // clone code generators
    await(clone('github:Zendro-dev/single-page-app-codegen#latest-stable', `./${name}/single-page-app-codegen`))
    log('Install code generator for single page application')
    await(spawn_console('npm', ['install'], {cwd:`./${name}/single-page-app-codegen`}))
    await(clone('github:Zendro-dev/graphql-server-model-codegen#latest-stable', `./${name}/graphql-server-model-codegen`))
    log('Install code generator for graphql server')
    await(spawn_console('npm', ['install'], {cwd:`./${name}/graphql-server-model-codegen`}))

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

    // create log directory
    await(spawn_console('mkdir', ['./logs'], {cwd:`./${name}`}))
    
    log(welcome) 
    log('Hints: Please edit the following config files if necessary: \n' +
    './graphql-server/config/data_models_storage_config.json \n' + 
    './graphql-server/config/globals.js \n' +
    './single-page-app/src/config/globals.js \n'+
    './graphiql-auth/src/config/globals.js')
}