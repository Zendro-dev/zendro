const fs = require('fs').promises
const {spawn_console} = require('../helper')

/**
 * Generate single-page-app code.
 * @param {object} options the options, e.g. output directory
 */
module.exports = async (options) => {
    const def_path = options.data_model_definitions
    const output_dir = options.output_dir || process.cwd()+'/single-page-app'
    const create_dir = options.createBaseDirs
    const tmp_dir = '../tmp_dir'
    const spa_code_gen_path = '../node_modules/single-page-app-codegen/index.js'

    // create a temporary directory for saving schema files
    await(spawn_console('mkdir', [tmp_dir]))
    for (let path of def_path) {
        if (path.slice(-5).toLowerCase()==='.json'){
            // copy single schema file to the temporary directory
            await(spawn_console('cp', [path, tmp_dir]))
        } else {
            let args = [spa_code_gen_path, '-f', path, '-o', output_dir]
            // generate migrations if necessary
            if (create_dir){
                args.push('-D')
            } 
            // generate code for files in provided directory
            await(spawn_console('node', args))
        }
    }

    const files = await(fs.readdir(tmp_dir))
    // generate code if the temporary directory is not empty
    if (files.length){
        let args = [spa_code_gen_path, '-f', tmp_dir, '-o', output_dir]
        if (create_dir){
            args.push('-D')
        } 
        await(spawn_console('node', args))
    }
    // remove the temporary directory
    await(spawn_console('rm', ['-r', tmp_dir]))
}