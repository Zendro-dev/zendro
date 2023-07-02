const { log, spawn_string, spawn_console } = require("../helper");

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
      // find PID from server-processes
      servPrc = spawnSync("netstat", ["-aofn"]);
      servPrc = servPrc.stdout.toString().split("\n");
      servPrc = servPrc.filter(line => ["0:8080", "0:3000", "0:7000"].some(port => line.includes(port)) )
                       .map(line => line.split(/ +/))
                       .map(line => [line[2], line.pop()]);

      for (let [endpoint, pid] of servPrc) {
        switch (endpoint) {
          case "0.0.0.0:3000":  
            parentPID = spawnSync("wmic", ["process", "where", `(ProcessID=${pid})`, "get", "ParentProcessID"]);
            parentPID = parentPID.stdout.toString().split(/\W+/)[1];
            log(`stop graphql-server, PIDs: ${[parentPID, pid]}\n`);
            await spawnSync("taskkill", ["/f", "/t", "/pid", parentPID], {stdio: "ignore"});
            break;

          case "0.0.0.0:7000":
            log(`stop graphiQL, PIDs: ${pid}\n`);
            await spawnSync("taskkill", ["/f", "/pid", pid], {stdio: "ignore"});
            break;

          case "0.0.0.0:8080":
            log(`stop single-page-app, PIDs: ${pid}\n`);
            await spawnSync("taskkill", ["/f", "/pid", pid], {stdio: "ignore"});
            break;
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
