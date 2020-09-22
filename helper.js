const { promisify } = require('util')
const download = promisify(require('download-git-repo'));
const ora = require('ora');
const { spawn } = require('child_process');
const chalk = require('chalk')

module.exports.log = content => console.log(chalk.magentaBright(content))

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

module.exports.spawn_pipe = async (...args) => {
    return new Promise(resolve => {
        const proc = spawn(...args)
        proc.stdout.pipe(process.stdout)
        proc.stderr.pipe(process.stderr)
        proc.on('close', () => {
            resolve()
        })
    })
}