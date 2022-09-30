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
      const res = await spawn_string("ps", ["-aef"], "grep", [regex], "awk", [
        "{print $2}",
      ]);

      let PID = parseInt(res);

      if (isNaN(PID)) {
        log(`${name} is not running, please check\n`);
      } else {
        log(`stop ${name}, PID: ${PID}\n`);
        await spawn_console("kill", ["-9", PID]);
      }
    }
  }
  log("Hint: log files are in the folder: " + process.cwd() + "/logs \n");
};
