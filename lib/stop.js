const { log, spawn_console } = require("../helper");
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
            endpoint = / (\d+\.){3}\d+:3000 /;
            break;
          case "giql":
            name = "graphiQL";
            endpoint = / (\d+\.){3}\d+:7000 /;
            break;
          case "spa":
            name = "single-page-app";
            endpoint = / (\d+\.){3}\d+:8080 /;
            break;
          default:
            log(`No such service, please check your input: ${serv}\n`);
            continue;
        }

        // find PID from server-processes
        let servPID = spawnSync("netstat", ["-aofn"]);
        servPID = servPID.stdout.toString().split("\n");
        servPID = servPID.filter(line => endpoint.test(line))[0];

        if (servPID != undefined) {
          servPID = servPID.split(/ +/).pop();

          // find and stop parent process and its subprocesses
          let processes = spawnSync("wmic", ["process", "where", `(ProcessID=${servPID})`, "get", "Caption,ParentProcessID"]);
          processes = processes.stdout.toString().split(/\s+/);
          let [ parentName, parentPID ] = processes.slice(2, 4);

          if (parentName === "node.exe") {
            log(`stop ${name}, PIDs: ${[parentPID, servPID]}\n`);
            spawnSync("taskkill", ["/f", "/t", "/pid", parentPID]);
          }
          
        } else {
          log(`${name} is not running, please check\n`);
        }
      }
      break;
  
    default:
      for (let serv of service) {
        let name = "";
        let regex = null;
        // filter PID by regular expression
        switch (serv) {
          case "gqs":
            name = "graphql-server";
            regexStr = ".*node server.js";
            if (!prod) {
              regexStr += "|.*nodemon.*server.js";
            }
            regex = new RegExp(regexStr);
            break;
          case "spa":
            name = "single-page-app";
            regex = /.*node.*next.*8080/;
            break;
          case "giql":
            name = "graphiQL";
            regex = /.*node.*next.*7000/;
            break;
          default:
            log(`No such service, please check your input: ${serv}\n`);
            continue;
        }
        const processes = spawnSync("ps", ["-aef"]).stdout.toString();
        let pids = processes.split("\n")
                            .filter(line => regex.test(line))
                            .reduce((a, line) => a.concat(line.match(/\S+/g).slice(1,3)), [])  // fetch pid and parent's pid
                            .filter(pid => pid != 1);
        pids = new Set(pids);

        if (!pids.size) {
          log(`${name} is not running, please check\n`);
        } else {
          log(`stop ${name}, PIDs: ${[...pids]}\n`);
          await spawn_console("kill", ["-9", ...pids]);
        }
      }
  }
  log("Hint: log files are in the folder: " + process.cwd() + "/logs \n");
};
