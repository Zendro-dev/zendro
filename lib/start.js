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

  function getSpawnOptions(dirName, logFileName, ignoreStdIn=false) {
    logFile = fs.openSync(
      path.normalize(process.cwd() + "/" + logFileName),
      "a"
    );
    stdin = ignoreStdIn ? "ignore" : process.stdin
    return {
      detached: true,
      stdio: [stdin, logFile, logFile],
      cwd: path.normalize(process.cwd() + "/" + dirName),
    }
  }

  if (services.has("gqs")) {
    let spawnOptions = getSpawnOptions("graphql-server", "logs/graphql-server.log", true);

    log("performing migrations...\n");
    const code = await spawn_log(
      false,
      "node",
      [path.normalize("./migrateDb.js"), "up"],
      spawnOptions
    );

    if (code !== 0) {
      log(
        `Migrations did not complete successfully (exit code ${code}). ` +
          `Aborting startup; check ${path.normalize(
            process.cwd() + "/logs/graphql-server.log"
          )} for details.\n`
      );
      return;
    }
  }

  for (let serv of services) {
    if (serv === "gqs") {
      let spawnOptions = getSpawnOptions("graphql-server", "logs/graphql-server.log", true);

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

      let spawnOptions = getSpawnOptions("single-page-app", "logs/single-page-app.log");

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
      let spawnOptions = getSpawnOptions("graphiql-auth", "logs/graphiql.log");

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
