const {promisify} = require('util')
const fs = require('fs/promises')
const {log, spawn_pipe} = require('../helper')

module.exports = async (name, options) => {
    const def_path = options.data_model_definitions
    const output_dir = options.output_dir || `./${name}/graphql-server`
    const migrations = options.migrations

    await(spawn_pipe('mkdir', ['./data_model_definition']))
    for (let path of def_path) {
        if (path.slice(-5).toLowerCase()==='.json'){
            await(spawn_pipe('cp', [path, './data_model_definition']))
        } else {
            let args = ['./node_modules/graphql-server-model-codegen/index.js', 
            '-f', path, '-o', output_dir]
            if (migrations){
                args.push('-m')
            } 
            await(spawn_pipe('node', args))
        }
    }

    const files = await(fs.readdir('./data_model_definition'))
    log(files.length)
    if (files.length){
        let args = [ './node_modules/graphql-server-model-codegen/index.js', 
        '-f', './data_model_definition/', '-o', output_dir]
        if (migrations){
            args.push('-m')
        }
        await(spawn_pipe('node', args))
    }
    await(spawn_pipe('rm', ['-r', './data_model_definition']))
}