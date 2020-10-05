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

/**
 * Execute Shell commands and save the output as JS string
 * @param {string} cmd1 the first command
 * @param {[string]} arg1 the arguments for the first command
 * @param {string} cmd2 the second command
 * @param {[string]} arg1 the arguments for the second command
 * @param {string} cmd3 the third command
 * @param {[string]} arg1 the arguments for the third command
 * @returns {string} result after the execution of commands
 */
module.exports.spawn_string = async (cmd1, arg1, cmd2, arg2, cmd3, arg3) => {
    return new Promise( (resolve, reject) => {
        const proc1 = spawn(cmd1, arg1)
        const proc2 = spawn(cmd2, arg2)
        const proc3 = spawn(cmd3, arg3)

        let output = ''

        proc1.stdout.on('data', data => proc2.stdin.write(data))         
        proc1.stderr.on('data', data => console.error(`${cmd1} stderr: ${data}`))          
        proc1.on('close', code => {
            if (code !== 0) {
                console.log(`${cmd1} process exited with code ${code}`)
            }
            proc2.stdin.end()
        })

        proc2.stdout.on('data', data => proc3.stdin.write(data))         
        proc2.stderr.on('data', data => console.error(`${cmd2} stderr: ${data}`))          
        proc2.on('close', code => {
            if (code !== 0) {
                console.log(`${cmd1} process exited with code ${code}`)
            }
            proc3.stdin.end()
        })

        proc3.stdout.on('data', data => output += data.toString())          
        proc3.on('close', () => resolve(output))
        proc3.on('error', err => reject(err))

    })
}