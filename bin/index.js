#!/usr/bin/env node
const { program } = require('commander')
const collect = (value, previous) => {return previous.concat([value])}

program.version(require('../package').version)

program
    .command('init')
    .description('init Zendro')
    .action(require('../lib/init'))

program
    .command('new <name>')
    .description('create new Zendro project')
    .action(require('../lib/new'))

program
    .command('generate-gqs <name>')
    .description('generate graphql-server code')
    .requiredOption('-d, --data_model_definitions <def_path>', 
    'path to a input directory or a JSON file', collect, [])
    .option('-o, --output_dir <output_dir>', 'output directory')
    .option('-m, --migrations', 'generate migrations', false)
    .action(require('../lib/generate_gqs'))

program
    .command('generate-spa <name>')
    .description('generate single page application code')
    .requiredOption('-d, --data_model_definitions <def_path>', 
    'path to a input directory or a JSON file', collect, [])
    .option('-o, --output_dir <output_dir>', 'output directory')
    .action(require('../lib/generate_spa'))

program.parse(process.argv)