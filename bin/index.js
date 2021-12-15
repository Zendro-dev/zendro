#!/usr/bin/env node
const { program } = require("commander");
const collect = (value, previous) => {
  return previous.concat([value]);
};

program.version(require("../package").version);

program
  .command("new <name>")
  .description("create new Zendro project")
  .option("-d, --dockerize", "include docker config files", false)
  .action(require("../lib/new"));

program
  .command("generate")
  .description("generate graphql-server code")
  .allowUnknownOption()
  .option(
    "-f, --data_model_definitions <def_path>",
    "path to a input directory or a JSON file",
    collect,
    []
  )
  .option("-o, --output_dir <output_dir>", "output directory")
  .option("-m, --migrations", "generate migrations", false)
  .action(require("../lib/generate"));

program
  .command("dockerize")
  .description("dockerize Zendro App")
  .option("-u, --up", "start docker service", false)
  .option("-d, --down", "stop docker service", false)
  .option("-p, --prod", "production mode", false)
  .action(require("../lib/dockerize"));

program
  .command("start [service...]")
  .description("start Zendro App")
  .option("-p, --prod", "production mode for SPA", false)
  .action(require("../lib/start"));

program
  .command("stop [service...]")
  .description("stop Zendro App")
  .option("-p, --prod", "production mode", false)
  .action(require("../lib/stop"));

program
  .command("migration:generate")
  .description("generate migrations")
  .option(
    "-f, --data_model_definitions <def_path>",
    "path to a input directory or a JSON file",
    collect,
    []
  )
  .option("-o, --output_dir <output_dir>", "output directory")
  .action(require("../lib/migration_generate"));

program
  .command("migration:up")
  .description("execute migrations")
  .action(require("../lib/migration_up"));

program
  .command("migration:down")
  .description("drop the last executed migration")
  .action(require("../lib/migration_down"));

program.parse(process.argv);
