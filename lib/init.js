const {promisify} = require('util')
const figlet = promisify(require('figlet'))
const chalk = require('chalk')
const log = content => console.log(chalk.magentaBright(content))
const {clone, spawn_pipe} = require('../helper')

module.exports = async () => {
    const welcome = await figlet('Welcome To Zendro!')
    log('Download Starter Pack')
    await(clone('github:Zendro-dev/ScienceDbStarterPack', './starter_pack'))
    log('Setup')
    await(spawn_pipe('bash', ['./setup.sh'], {cwd:'./starter_pack'}))
    await(spawn_pipe('cp', ['-r', './seeders', './graphql-server'], {cwd:'./starter_pack'}))
    log('Download Images for Code Generaters')
    await(spawn_pipe('docker', ['build', '-f', 'Dockerfile.code-generators', 
    '-t', 'sciencedb-code-generators:latest', '.'], {cwd:'./starter_pack'}))
    log(welcome) 
}