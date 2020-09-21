#!/usr/bin/env node
// console.log( "Hello!" );
const { program } = require('commander');
program.version(require('../package').version);

program
    .command('init')
    .description('init Zendro')
    .action(require('../lib/init'))

program
    .command('new <name>')
    .description('create new Zendro project')
    .action(require('../lib/new'))

program.parse(process.argv);