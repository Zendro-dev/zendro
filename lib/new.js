const {promisify} = require('util')
const figlet = promisify(require('figlet'))
const {log, spawn_pipe} = require('../helper')

module.exports = async (name) => {
    const welcome = await figlet(`Welcome To ${name}!`)
    log('Create new Zendro Project')
    await(spawn_pipe('cp', ['-r', './starter_pack', `./${name}`]))
    log(welcome) 
}