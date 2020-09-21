const {promisify} = require('util')
const figlet = promisify(require('figlet'))
const chalk = require('chalk')
const log = content => console.log(chalk.magentaBright(content))
const {spawn_pipe} = require('../helper')

module.exports = async (name) => {
    const welcome = await figlet(`Welcome To ${name}!`)
    log('Create new Zendro Project')
    await(spawn_pipe('cp', ['-r', './starter_pack', `./${name}`]))
    log('Create new Images for Code Generaters')
    await(spawn_pipe('docker', ['build', '-f', 'Dockerfile.code-generators', 
    '-t', `sciencedb-code-generators:${name}-latest`, '.'], {cwd:`./${name}`}))
    log(welcome) 
}