const { promisify } = require('util')
const download = promisify(require('download-git-repo'))
const ora = require('ora')
const { spawn } = require('child_process')
const chalk = require('chalk')
const fs = require('fs')

/**
 * Write log to console with magenta color.
 * @param {string} content the log content
 */
module.exports.log = content => console.log(chalk.magentaBright(content))

/**
 * Download a repository with a elegant terminal spinner.
 * @param {string} repo the repository path in gitHub
 * @param {string} desc the destination of downloaded repository
 */
module.exports.clone = async (repo, desc) => {
    const process = ora(`Download ${repo}`);
    process.start();
    try {
        await download(repo, desc)
    } catch (error) {
        process.fail()
    }
    process.succeed()
}

/**
 * Execute Shell command and pipe output to console
 * @param {...} args the command and its configuration, e.g. work directory
 */
module.exports.spawn_console = async (...args) => {
    return new Promise(resolve => {
        const proc = spawn(...args)
        proc.stdout.pipe(process.stdout)
        proc.stderr.pipe(process.stderr)
        proc.on('close', () => {
            resolve()
        })
    })
}


/**
 * Execute Shell command, separate subprocess if necessary
 * @param {boolean} unref the flag for separating the subprocess from the main process
 * @param {...} args the command and its configuration, e.g. environment variables
 */
module.exports.spawn_log = async (unref, ...args) => {
    return new Promise(resolve => {
        const proc = spawn(...args)
        if (unref){
            proc.unref()
        }
        proc.on('close', () => {
            resolve()
        })
    })
}