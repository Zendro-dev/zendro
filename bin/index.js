#!/usr/bin/env node
const { program, Option } = require("commander");
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
  .option("-v, --volume", "remove volume and migration log", false)
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

program
  .command("bulk-create")
  .description("parse input file and upload parsed records")
  .option("-f, --file_path <file_path>", "file path")
  .option("-n, --model_name <model_name>", "model name")
  .option("-s, --sheet_name <sheet_name>", "sheet name")
  .option("-r, --remote_server", "upload to a remote server", false)
  .action(require("../lib/bulk_create"));

program
  .command("bulk-download")
  .description("download records into a CSV file")
  .option("-f, --file_path <file_path>", "path for storing file")
  .option("-n, --model_name <model_name>", "model name")
  .option("-r, --remote_server", "download from a remote server", false)
  .action(require("../lib/bulk_download"));

program
  .command("set-up <name>")
  .description("set up a sandbox with default data models and SQLite")
  .option("-d, --dockerize", "include docker config files", false)
  .action(require("../lib/setup"));

program
  .command("create-plot")
  .description("create a plot")
  .option("-f, --plot_name <plot_name>", "customized plot name")
  .addOption(
    new Option(
      "-t, --type <type>",
      "type of the visualization library"
    ).choices(["plotly", "d3"])
  )
  .addOption(
    new Option("-m, --menu <menu>", "the location of the plot menu").choices([
      "none",
      "top",
      "left",
    ])
  )
  .option(
    "-n, --menu_item_name <menu_item_name>",
    "current item name in the plot menu"
  )
  .option("-p, --default_plots", "create default plots", false)
  .action(require("../lib/create_plot"));

program.parse(process.argv);
