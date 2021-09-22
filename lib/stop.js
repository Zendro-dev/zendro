const { log, spawn_string, spawn_console } = require("../helper");

/**
 * Stop Zendro App.
 * @param {... string} service service name
 */
module.exports = async (service, options) => {
  const prod = options.prod;
  // stop all service by default
  if (!service.length) {
    service = ["gqs", "spa", "giql"];
    log("stop all service: " + service + " \n");
  }

  for (let serv of service) {
    let name = "";
    let regular_exp = [];
    // filter PID by regular expression
    if (serv === "gqs") {
      name = "graphql-server";
      regular_exp.push(".*/node server.js");
      regular_exp.push(".*/nodemon server.js");
    } else if (serv == "spa") {
      name = "single-page-app";
      regular_exp.push(prod ? ".*node.*serve.*out" : ".*node.*next.*");
    } else if (serv == "giql") {
      name = "graphiQL";
      regular_exp.push("[0-9] node .*graphiql.*js");
    } else {
      log("No such service, please check your input:" + serv);
      continue;
    }
    for (let regex of regular_exp) {
      let PID = parseInt(
        await spawn_string("ps", ["-aef"], "grep", [regex], "awk", [
          "{print $2}",
        ])
      );
      if (isNaN(PID)) {
        log(`${name} is not running, please check\n`);
      } else {
        log(`stop ${name}, PID: ${PID}\n`);
        spawn_console("sudo", ["kill", "-9", PID]);
      }
    }
  }
  log("Hint: log files are in the folder: " + process.cwd() + "/logs \n");
};
