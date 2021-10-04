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
  .command("generate-gqs")
  .description("generate graphql-server code")
  .allowUnknownOption()
  .option(
    "-f, --data_model_definitions <def_path>",
    "path to a input directory or a JSON file",
    collect,
    [process.cwd() + "/data_model_definitions"]
  )
  .option("-o, --output_dir <output_dir>", "output directory")
  .option("-m, --migrations", "generate migrations", false)
  .action(require("../lib/generate_gqs"));

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

program.parse(process.argv);
