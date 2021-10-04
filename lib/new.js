const { promisify } = require("util");
const figlet = promisify(require("figlet"));
const { log, spawn_console, spawn_log, clone } = require("../helper");
const version = require("../zendro_dependencies.json");
const fs = require("fs");
/**
 * Generate graphql-server code.
 * @param {string} name new project name
 * @param {object} options the options, e.g. keep docker files
 */
module.exports = async (name, options) => {
  const dockerize = options.dockerize;

  const welcome = await figlet(`Welcome To Zendro!`);
  log("Create new Zendro Project.");
  const prefix = __dirname.slice(0, -4) + "/node_modules/";
  await spawn_console(
    "cp",
    ["-r", prefix + "ZendroStarterPack/.", `./${name}`],
    { cwd: process.cwd() }
  );
  console.log(process.cwd() + `/${name}`);
  await clone(
    "github:Zendro-dev/single-page-app#" + version["single-page-app"],
    process.cwd() + `/${name}/single-page-app`
  );
  await clone(
    "github:Zendro-dev/graphql-server#" + version["graphql-server"],
    process.cwd() + `/${name}/graphql-server`
  );
  await clone(
    "github:Zendro-dev/graphiql-auth#" + version["graphiql-auth"],
    process.cwd() + `/${name}/graphiql-auth`
  );

  // create log directory
  await spawn_console("mkdir", ["-p", "./logs"], {
    cwd: process.cwd() + `/${name}`,
  });
  await spawn_console("cp", ["-r", "./seeders", "./graphql-server"], {
    cwd: process.cwd() + `/${name}`,
  });
  await spawn_console("rm", [".gitkeep"], {
    cwd: process.cwd() + `/${name}/data_model_definitions`,
  });
  await spawn_console("rm", ["setup.sh"], {
    cwd: process.cwd() + `/${name}`,
  });
  const env_path = __dirname.slice(0, -4);
  await spawn_console("cp", [`${env_path}/.env.graphql_server`, ".env"], {
    cwd: process.cwd() + `/${name}/graphql-server`,
  });
  await spawn_console(
    "cp",
    [`${env_path}/.env.development`, ".env.development"],
    {
      cwd: process.cwd() + `/${name}/single-page-app`,
    }
  );
  await spawn_console(
    "cp",
    [`${env_path}/.env.production`, ".env.production"],
    {
      cwd: process.cwd() + `/${name}/single-page-app`,
    }
  );

  log("install graphql-server packages \n");
  let log_gqs = fs.openSync(
    process.cwd() + `/${name}/logs/graphql-server.log`,
    "w"
  );
  await spawn_log(false, "npm", ["install"], {
    detached: true,
    stdio: ["ignore", log_gqs, log_gqs],
    cwd: process.cwd() + `/${name}/graphql-server`,
  });

  log("install single-page-app packages \n");
  let log_spa = fs.openSync(
    process.cwd() + `/${name}/logs/single-page-app.log`,
    "w"
  );
  await spawn_log(false, "yarn", ["install"], {
    detached: true,
    stdio: ["ignore", log_spa, log_spa],
    cwd: process.cwd() + `/${name}/single-page-app`,
  });

  log("install graphiQL packages \n");
  let log_giql = fs.openSync(process.cwd() + `/${name}/logs/graphiql.log`, "w");
  await spawn_log(false, "npm", ["install"], {
    detached: true,
    stdio: ["ignore", log_giql, log_giql],
    cwd: process.cwd() + `/${name}/graphiql-auth`,
  });

  // remove docker files by default
  if (!dockerize) {
    log("Remove Docker files.");
    await spawn_console("rm", ["-r", "./contexts"], {
      cwd: process.cwd() + `/${name}`,
    });
    await spawn_console("rm", ["-r", "./scripts"], {
      cwd: process.cwd() + `/${name}`,
    });
    await spawn_console("rm", ["docker-compose-dev.yml"], {
      cwd: process.cwd() + `/${name}`,
    });
    await spawn_console("rm", ["docker-compose-prod.yml"], {
      cwd: process.cwd() + `/${name}`,
    });
  }

  log(welcome);
  log(
    "Hints: Please edit the following config files if necessary: \n" +
      "without docker setup: ./graphql-server/config/data_models_storage_config.json \n" +
      "with docker setup: ./config/data_models_storage_config.json \n" +
      "./graphql-server/.env \n" +
      "SPA in development mode: ./single-page-app/.env.development \n" +
      "SPA in production mode: ./single-page-app/.env.production \n" +
      "./graphiql-auth/.env"
  );
};
