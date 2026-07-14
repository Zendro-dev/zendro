#!/usr/bin/env node
const { program, Option, Argument } = require("commander");
const collect = (value, previous) => {
  return previous.concat([value]);
};

program.version(require("../package").version);

const dockerize_option = new Option("-d, --dockerize", "include docker config files").default(false);
const services = ["spa", "giql", "gqs"];

program
  .command("new <name>")
  .description("create new Zendro project")
  .addOption(dockerize_option)
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
  .addOption(
    new Option("-u, --up", "start docker service")
      .default(false)
      .conflicts("down")
  )
  .addOption(
    new Option("-d, --down", "stop docker service")
      .default(false)
      .conflicts("up")
  )
  .option("-p, --prod", "production mode", false)
  .option("-v, --volume", "remove volume and migration log", false)
  .action(require("../lib/dockerize"));

program
  .command("start")
  .description("start Zendro App")
  .addArgument(
    new Argument("[service...]", "services to start").choices(services).default(services)
  )
  .option("-p, --prod", "production mode for SPA", false)
  .action(require("../lib/start"));

program
  .command("stop")
  .description("stop Zendro App")
  .addArgument(
    new Argument("[service...]", "services to stop").choices(services).default(services)
  )
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
  .addOption(dockerize_option)
  .action(require("../lib/setup"));

program
  .command("rm <name>")
  .description(
    "delete a Zendro project, including its docker containers, project images and volumes"
  )
  .option("-f, --force", "skip the confirmation prompt", false)
  .action(require("../lib/rm"));

program
  .command("set-next-auth-secret")
  .description(
    "set the auth secret for the single-page-app (spa, NEXTAUTH_SECRET) or graphql-server (gqs, SESSION_SECRET - required once AUTH_ENABLED is \"true\"). Genrate a good secret e.g. via 'openssl rand -base64 32'."
  )
  .addArgument(
    new Argument("<service>", "target service").choices(["gqs", "spa"])
  )
  .argument("<secret>", "the new secret value")
  .addOption(new Option("-m, --modes <mode...>", "specify for which mode the secret should be used for").choices(["prod", "dev"]).default(["prod", "dev"]))
  .action(require("../lib/set_next_auth_secret"));

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
