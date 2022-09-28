const { log, spawn_log, spawn_console } = require("../helper");
const fs = require("fs-extra");
const path = require("path");
/**
 * Start Zendro App.
 * @param {[string]} service service name
 * @param {object} options the options, e.g. install packages
 */
module.exports = async (service, options) => {
  const prod = options.prod;
  if (!service.length) {
    service = ["gqs", "giql", "spa"];
    log("start all service: " + service + " \n");
  }
  for (let serv of service) {
    if (serv === "gqs") {
      let log_gqs = fs.openSync(
        path.normalize(process.cwd() + "/logs/graphql-server.log"),
        "a"
      );
      log("start graphql-server...\n");
      if (prod) {
        spawn_log(true, "node", [path.normalize("./migrateDbAndStartServer.js")], {
          detached: true,
          stdio: ["ignore", log_gqs, log_gqs],
          cwd: path.normalize(process.cwd() + "/graphql-server"),
        });
      } else {
        spawn_log(true, "node", [path.normalize("./migrateDbAndStartServer.js"), "dev"], {
          detached: true,
          stdio: ["ignore", log_gqs, log_gqs],
          cwd: path.normalize(process.cwd() + "/graphql-server"),
        });
      }
    } else if (serv === "spa") {
      let log_spa = fs.openSync(
        path.normalize(process.cwd() + "/logs/single-page-app.log"),
        "a"
      );
      log("start single-page-app...\n");

      if (prod) {
        await fs.remove(path.normalize(process.cwd() + "/single-page-app/.next"))

        log("SPA: build...");
          await spawn_log(false, "yarn", ["build"], {
          detached: true,
          stdio: [process.stdin, log_spa, log_spa],
          cwd: path.normalize(process.cwd() + "/single-page-app"),
        });
        log("SPA: start...\n");
        spawn_log(true, "yarn", ["start"], {
          detached: true,
          stdio: [process.stdin, log_spa, log_spa],
          cwd: path.normalize(process.cwd() + "/single-page-app"),
        });
      } else {
        await fs.remove(path.normalize(process.cwd() + "/single-page-app/.next"))

        spawn_log(true, "yarn", ["dev"], {
          detached: true,
          stdio: [process.stdin, log_spa, log_spa],
          cwd: path.normalize(process.cwd() + "/single-page-app"),
        });
      }
    } else if (serv === "giql") {
      let log_giql = fs.openSync(
        path.normalize(process.cwd() + "/logs/graphiql.log"),
        "a"
      );
      log("start graphiQL... \n");
      if (prod) {
        await fs.remove(path.normalize(process.cwd() + "/graphiql-auth/.next"))

        log("GiQL: build...");
        await spawn_log(false, "yarn", ["build"], {
          detached: true,
          stdio: [process.stdin, log_giql, log_giql],
          cwd: path.normalize(process.cwd() + "/graphiql-auth"),
        });
        log("GiQL: start...\n");
        spawn_log(true, "yarn", ["start"], {
          detached: true,
          stdio: [process.stdin, log_giql, log_giql],
          cwd: path.normalize(process.cwd() + "/graphiql-auth"),
        });
      } else {
        await fs.remove(path.normalize(process.cwd() + "/graphiql-auth/.next"))

        spawn_log(true, "yarn", ["dev"], {
          detached: true,
          stdio: [process.stdin, log_giql, log_giql],
          cwd: path.normalize(process.cwd() + "/graphiql-auth"),
        });
      }
    } else {
      log("No such service, please check your input.");
    }
  }
  log("Hint: log files are in the folder: " + path.normalize(process.cwd() + "/logs") + "\n");
};
