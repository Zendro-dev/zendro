const { log, spawn_string, spawn_console } = require("../helper");
const { spawnSync } = require("child_process");

/**
 * Stop Zendro App.
 * @param {[string]} service service name
 */
module.exports = async (service, options) => {
  const prod = options.prod;
  // stop all service by default
  if (!service.length) {
    service = ["gqs", "giql", "spa"];
    log("stop all service: " + service + " \n");
  }

  switch (process.platform) {
    case "win32":
      for (let serv of service) {
        let name = "";
        let endpoint = "";
        switch (serv) {
          case "gqs":
            name = "graphql-server";
            endpoint = "0.0.0.0:3000";
            break;
          case "giql":
            name = "graphiQL";
            endpoint = "0.0.0.0:7000";
            break;
          case "spa":
            name = "single-page-app";
            endpoint = "0.0.0.0:8080";
            break;
          default:
            log(`No such service, please check your input: ${serv}\n`);
            break;
        }

        if (name) {
          // find PID from server-processes
          let servPID = spawnSync("netstat", ["-aofn"]);
          servPID = servPID.stdout.toString().split("\n");
          servPID = servPID.filter(line => line.includes(endpoint))[0];

          if (servPID != undefined) {
            servPID = servPID.split(/ +/).pop();

            // find and stop parent process and its subprocesses
            let parentPID = spawnSync("wmic", ["process", "where", `(ProcessID=${servPID})`, "get", "ParentProcessID"]);
            parentPID = parentPID.stdout.toString().split(/\W+/)[1];
            log(`stop ${name}, PIDs: ${[parentPID, servPID]}\n`);
            await spawnSync("taskkill", ["/f", "/t", "/pid", parentPID]);
          } else {
            log(`${name} is not running, please check\n`);
          }
        }
      }
      break;
  
    default:
      for (let serv of service) {
        let name = "";
        let regular_exp = [];
        // filter PID by regular expression
        if (serv === "gqs") {
          name = "graphql-server";
          if (!prod) {
            regular_exp.push(".*nodemon.*server.js");
          }
          regular_exp.push(".*node server.js");
        } else if (serv == "spa") {
          name = "single-page-app";
          regular_exp.push(".*node.*next.*8080");
        } else if (serv == "giql") {
          name = "graphiQL";
          regular_exp.push(".*node.*next.*7000");
        } else {
          log("No such service, please check your input:" + serv);
          continue;
        }
        for (let regex of regular_exp) {
          // TODO add | grep -v grep as cmd3; spawn_string needs a new argument for that.
          const res = await spawn_string("ps", ["-aef"], "grep", [regex], "awk", [
            "{print $2}",
          ]);
          const PIDArr = res.trim().split('\n').map(pid => parseInt(pid));
    
          if (PIDArr.every(pid => isNaN(pid))) {
            log(`${name} is not running, please check\n`);
          } else {
            log(`stop ${name}, PIDs: ${PIDArr}\n`);
            await spawn_console("kill", ["-9", ...PIDArr]);
          }
        }
      }
  }
  log("Hint: log files are in the folder: " + process.cwd() + "/logs \n");
};
