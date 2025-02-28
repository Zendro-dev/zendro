const { promisify } = require("util");
const figlet = promisify(require("figlet"));
const { log, spawn_log, clone, yarn } = require("../helper");
const version = require("../zendro_dependencies.json");
const fs = require("fs-extra");
const path = require("path");
/**
 * Generate graphql-server code.
 * @param {string} name new project name
 * @param {object} options the options, e.g. keep docker files
 */
module.exports = async (name, options) => {
  const dockerize = options.dockerize;

  const welcome = await figlet(`Welcome To Zendro!`);
  log("Create new Zendro Project.");
  const prefix = path.normalize(__dirname.slice(0, -4) + "/node_modules/");
  await fs.copy(path.normalize(prefix + "ZendroStarterPack/."), name);

  await clone(
    "github:Zendro-dev/single-page-app#" + version["single-page-app"],
    path.normalize(process.cwd() + `/${name}/single-page-app`)
  );
  await clone(
    "github:Zendro-dev/graphql-server#" + version["graphql-server"],
    path.normalize(process.cwd() + `/${name}/graphql-server`)
  );
  await clone(
    "github:Zendro-dev/graphiql-auth#" + version["graphiql-auth"],
    path.normalize(process.cwd() + `/${name}/graphiql-auth`)
  );

  // create log directory
  await fs.mkdirp(path.normalize(process.cwd() + `/${name}/logs`));
  await fs.mkdirp(path.normalize(process.cwd() + `/${name}/import`));
  await fs.copy(
    path.normalize(
      process.cwd() + `/${name}/2021-12-08T17_37_17.804Z#keycloak.js`
    ),
    path.normalize(
      `${name}/graphql-server/migrations/2021-12-08T17_37_17.804Z#keycloak.js`
    )
  );
  await fs.copy(
    path.normalize(
      process.cwd() + `/${name}/2025-02-23T17_37_17.804Z#schema_to_text_file.js`
    ),
    path.normalize(
      `${name}/graphql-server/migrations/2025-02-23T17_37_17.804Z#schema_to_text_file.js`
    )
  );
  await fs.remove(
    path.normalize(process.cwd() + `/${name}/data_model_definitions/.gitkeep`)
  );
  await fs.remove(path.normalize(process.cwd() + `/${name}/setup.sh`));

  await fs.createFile(path.normalize(`${name}/graphql-server/data.db`));

  await fs.copy(
    path.normalize(process.cwd() + `/${name}/.env.example`),
    path.normalize(process.cwd() + `/${name}/.env`)
  );

  const env_path = path.normalize(__dirname.slice(0, -4) + "/env");
  await fs.copy(
    path.normalize(`${env_path}/.env.graphql_server`),
    path.normalize(process.cwd() + `/${name}/graphql-server/.env`)
  );
  await fs.copy(
    path.normalize(`${env_path}/.env.development.spa`),
    path.normalize(process.cwd() + `/${name}/single-page-app/.env.development`)
  );
  await fs.copy(
    path.normalize(`${env_path}/.env.production.spa`),
    path.normalize(process.cwd() + `/${name}/single-page-app/.env.production`)
  );
  await fs.copy(
    path.normalize(`${env_path}/.env.development.graphiql`),
    path.normalize(process.cwd() + `/${name}/graphiql-auth/.env.development`)
  );
  await fs.copy(
    path.normalize(`${env_path}/.env.production.graphiql`),
    path.normalize(process.cwd() + `/${name}/graphiql-auth/.env.production`)
  );

  if (!dockerize) {
    log("install graphql-server packages \n");
    let log_gqs = fs.openSync(
      path.normalize(process.cwd() + `/${name}/logs/graphql-server.log`),
      "w"
    );
    await spawn_log(false, "npm", ["install"], {
      detached: true,
      stdio: ["ignore", log_gqs, log_gqs],
      cwd: path.normalize(process.cwd() + `/${name}/graphql-server`),
    });

    log("install single-page-app packages \n");
    let log_spa = fs.openSync(
      path.normalize(process.cwd() + `/${name}/logs/single-page-app.log`),
      "w"
    );
    await spawn_log(false, "npm", ["exec", "--", yarn, "install"], {
      detached: true,
      stdio: ["ignore", log_spa, log_spa],
      cwd: path.normalize(process.cwd() + `/${name}/single-page-app`),
    });

    log("install graphiQL packages \n");
    let log_giql = fs.openSync(
      path.normalize(process.cwd() + `/${name}/logs/graphiql.log`),
      "w"
    );
    await spawn_log(false, "npm", ["exec", "--", yarn, "install"], {
      detached: true,
      stdio: ["ignore", log_giql, log_giql],
      cwd: path.normalize(process.cwd() + `/${name}/graphiql-auth`),
    });

    // remove docker files by default
    log("Remove Docker files.");
    await fs.remove(path.normalize(`${name}/contexts`));
    await fs.remove(path.normalize(`${name}/scripts`));
    await fs.remove(path.normalize(`${name}/docker-compose-dev.yml`));
    await fs.remove(path.normalize(`${name}/docker-compose-prod.yml`));
  }

  log(welcome);
  log(
    "Hints: Please edit the following config files if necessary: \n" +
      "without docker setup: ./graphql-server/config/data_models_storage_config.json \n" +
      "with docker setup: ./config/data_models_storage_config.json \n" +
      "GraphiQL in development mode: ./graphql-server/.env.development \n" +
      "GraphiQL in production mode: ./graphql-server/.env.production \n" +
      "SPA in development mode: ./single-page-app/.env.development \n" +
      "SPA in production mode: ./single-page-app/.env.production \n"
  );
};
