const { log, spawn_log, spawn_unref } = require("../helper");
const fs = require("fs-extra");
const path = require("path");

// Where per-project server pids are persisted so `zendro stop`/`zendro rm`
// can later target exactly this project's processes (see lib/stop.js) instead
// of grepping every matching process on the machine by port.
const PID_DIR = ".zendro";

/**
 * Persist a started service's pid under <project>/.zendro/<serv>.pid.
 * @param {string} serv service key ("gqs" | "giql" | "spa")
 * @param {import('child_process').ChildProcess} proc the spawned child
 */
function writePid(serv, proc) {
  if (!proc || !proc.pid) return;
  const dir = path.normalize(process.cwd() + "/" + PID_DIR);
  fs.mkdirpSync(dir);
  fs.writeFileSync(path.normalize(dir + `/${serv}.pid`), String(proc.pid));
}

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
        writePid(
          "gqs",
          spawn_unref(
            "node",
            [path.normalize("./startServer.js"), ...args],
            spawnOptions
          )
        );
      }

      await spawn_log(false, "npm", ["run", "build:graphiql"], spawnOptions);
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
        await spawn_log(false, "npm", ["run", "build"], spawnOptions);
        log("SPA: start...\n");
        writePid("spa", spawn_unref("npm", ["run", startScript], spawnOptions));
      } else {
        await fs.remove(
          path.normalize(process.cwd() + "/single-page-app/.next")
        );

        writePid("spa", spawn_unref("npm", ["run", devScript], spawnOptions));
      }
    } else if (serv === "giql") {
      let spawnOptions = getSpawnOptions("graphiql-auth", "logs/graphiql.log");

      log("start graphiQL... \n");
      // graphiql-auth serves a pre-built GraphiQL bundle, so build it before
      // starting in BOTH modes - its own dev/start scripts don't build it,
      // and without it server.js 500s with "GraphiQL has not been built".
      log("GiQL: build...");
      await spawn_log(false, "npm", ["run", "build:graphiql"], spawnOptions);
      log("GiQL: start...\n");
      if (prod) {
        writePid("giql", spawn_unref("npm", ["run", startScript], spawnOptions));
      } else {
        writePid("giql", spawn_unref("npm", ["run", devScript], spawnOptions));
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
