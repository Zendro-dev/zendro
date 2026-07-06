const { log, spawn_log, yarn } = require("../helper");
const fs = require("fs-extra");
const path = require("path");

// TODO generic solution to pass env variable to package.json script and using default
const [ startScript, devScript ] =
  process.platform === "win32" ? [ "start:win", "dev:win" ] : [ "start", "dev" ];

/**
 * Start Zendro App.
 * @param {[string]} services service names (valid: "gqs", "giql", "spa")
 * @param {object} options the options, e.g. install packages
 */
module.exports = async (services, options) => {
  const prod = options.prod;
  if (!services.length) {
    services = new Set("gqs", "giql", "spa");
    log("start all services: " + services + " \n");
  } else {
    services = new Set(services);
  }

  if (services.has("gqs")) {
    log("performing migrations...\n");
    await spawn_log(
      true,
      "node",
      [path.normalize("./migrateDb.js")],
      {
        detached: true,
        stdio: ["ignore", log_gqs, log_gqs],
        cwd: path.normalize(process.cwd() + "/graphql-server"),
      }
    );
  }

  function getSpawnOptions(dirName, logFileName) {
    log = fs.openSync(
      path.normalize(process.cwd() + logFileName),
      "a"
    );
    return {
      detached: true,
      stdio: [process.stdin, log, log],
      cwd: path.normalize(process.cwd() + dirName),
    }
  }

  for (let serv of services) {
    if (serv === "gqs") {
      spawnOptions = getSpawnOptions("graphql-server", "logs/graphql-server.log");
      log("start graphql-server...\n");

      function startServer(...args) {
        spawn_log(
          true,
          "node",
          [path.normalize("./startServer.js"), ...args],
          spawnOptions
        );
      }

      if (prod) {
        startServer();
      } else {
        startServer("dev");
      }
    } else if (serv === "spa") {
      log("start single-page-app...\n");

      spawnOptions = getSpawnOptions("single-page-app", "logs/single-page-app.log");

      if (prod) {
        await fs.remove(
          path.normalize(process.cwd() + "/single-page-app/.next")
        );

        log("SPA: build...");
        await spawn_log(false, "npm", ["exec", "--", yarn, "build"], spawnOptions);
        log("SPA: start...\n");
        spawn_log(true, "npm", ["exec", "--", yarn, startScript], spawnOptions);
      } else {
        await fs.remove(
          path.normalize(process.cwd() + "/single-page-app/.next")
        );

        spawn_log(true, "npm", ["exec", "--", yarn, devScript], spawnOptions);
      }
    } else if (serv === "giql") {
      spawnOptions = getSpawnOptions("graphiql-auth", "logs/graphiql.log");

      log("start graphiQL... \n");
      if (prod) {
        await fs.remove(path.normalize(process.cwd() + "/graphiql-auth/.next"));

        log("GiQL: build...");
        await spawn_log(false, "npm", ["exec", "--", yarn, "build"], spawnOptions);
        log("GiQL: start...\n");
        spawn_log(true, "npm", ["exec", "--", yarn, startScript], spawnOptions);
      } else {
        await fs.remove(path.normalize(process.cwd() + "/graphiql-auth/.next"));

        spawn_log(true, "npm", ["exec", "--", yarn, devScript], spawnOptions);
      }
    } else {
      log("No such service, please check your input.");
    }
  }
  log(
    "Hint: log files are in the folder: " +
      path.normalize(process.cwd() + "/logs") +
      "\n"
  );
};
