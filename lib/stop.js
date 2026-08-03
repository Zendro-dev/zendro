const { log } = require("../helper");
const { spawnSync } = require("child_process");
const fs = require("fs-extra");
const path = require("path");

// Per-project directory where `zendro start` persists each server's pid.
const PID_DIR = ".zendro";

const SERVICE_NAMES = {
  gqs: "graphql-server",
  giql: "graphiQL",
  spa: "single-page-app",
};

/**
 * Whether a process with the given pid currently exists.
 * @param {number} pid
 * @returns {boolean}
 */
function isAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    // EPERM means the process exists but we may not signal it - still alive.
    return error.code === "EPERM";
  }
}

/**
 * Stop a process and the process group it leads. `zendro start` spawns each
 * server detached, so the pid is a group leader; killing the negated pid takes
 * down the server together with its children (npm -> next -> workers, nodemon,
 * the on-demand page compilers, ...).
 * @param {number} pid
 */
function killProcess(pid) {
  if (process.platform === "win32") {
    // /t stops the whole process tree, /f forces it.
    spawnSync("taskkill", ["/f", "/t", "/pid", String(pid)]);
    return;
  }
  try {
    process.kill(-pid, "SIGKILL"); // whole process group
  } catch (error) {
    try {
      process.kill(pid, "SIGKILL"); // fall back to just the leader
    } catch (_) {
      /* already gone */
    }
  }
}

/**
 * Best-effort fallback for when no pid file exists (e.g. a server started by an
 * older Zendro CLI that didn't persist pids): find the process by its listen
 * port / command line and kill it. This matches globally on the machine, not
 * per project - which is exactly the imprecision the pid files above remove.
 * @param {string} serv service key
 * @param {boolean} prod whether Zendro was started in production mode
 */
function legacyStopByMatch(serv, prod) {
  const name = SERVICE_NAMES[serv];

  if (process.platform === "win32") {
    let endpoint;
    switch (serv) {
      case "gqs":
        endpoint = / (\d+\.){3}\d+:3000 /;
        break;
      case "giql":
        endpoint = / (\d+\.){3}\d+:7070 /;
        break;
      case "spa":
        endpoint = / (\d+\.){3}\d+:8080 /;
        break;
    }

    let servPID = spawnSync("netstat", ["-aofn"]).stdout.toString().split("\n");
    servPID = servPID.filter((line) => endpoint.test(line))[0];

    if (servPID !== undefined) {
      servPID = servPID.split(/ +/).pop();
      let processes = spawnSync("wmic", [
        "process",
        "where",
        `(ProcessID=${servPID})`,
        "get",
        "Caption,ParentProcessID",
      ]);
      processes = processes.stdout.toString().split(/\s+/);
      let [parentName, parentPID] = processes.slice(2, 4);

      if (parentName === "node.exe") {
        log(`stop ${name}, PIDs: ${[parentPID, servPID]}\n`);
        spawnSync("taskkill", ["/f", "/t", "/pid", parentPID]);
      }
    } else {
      log(`${name} is not running, please check\n`);
    }
    return;
  }

  let regex = null;
  let regexStr;
  switch (serv) {
    case "gqs":
      regexStr = ".*node server.js";
      if (!prod) {
        regexStr += "|.*nodemon.*server.js";
      }
      regex = new RegExp(regexStr);
      break;
    case "spa":
      regex = /.*node.*next.*8080/;
      break;
    case "giql":
      regex = /.*node.*next.*7070/;
      break;
  }

  const processes = spawnSync("ps", ["-aef"]).stdout.toString();
  let pids = processes
    .split("\n")
    .filter((line) => regex.test(line))
    .reduce((a, line) => a.concat(line.match(/\S+/g).slice(1, 3)), []) // pid + ppid
    .filter((pid) => pid != 1);
  pids = new Set(pids);

  if (!pids.size) {
    log(`${name} is not running, please check\n`);
  } else {
    log(`stop ${name}, PIDs: ${[...pids]}\n`);
    spawnSync("kill", ["-9", ...pids]);
  }
}

/**
 * Stop Zendro App.
 * @param {[string]} service service names (valid: "gqs", "giql", "spa"); empty
 * means all
 * @param {object} options e.g. { prod, projectDir }. projectDir is the project
 * root to read pids from; it defaults to the current working directory (which
 * is correct when the user runs `zendro stop` from inside the project), but
 * `zendro rm` runs from the parent directory and must pass the project path
 * explicitly - otherwise the pids are looked for in the wrong place and every
 * server falls back to the unreliable port/command matching.
 */
module.exports = async (service, options) => {
  const prod = options.prod;
  // stop all services by default
  if (!service.length) {
    service = ["gqs", "giql", "spa"];
    log("stop all service: " + service + " \n");
  }

  const pidDir = path.normalize((options.projectDir || process.cwd()) + "/" + PID_DIR);

  for (let serv of service) {
    if (!SERVICE_NAMES[serv]) {
      log(`No such service, please check your input: ${serv}\n`);
      continue;
    }

    const pidFile = path.normalize(pidDir + `/${serv}.pid`);
    if (fs.existsSync(pidFile)) {
      const pid = parseInt(fs.readFileSync(pidFile, "utf8").trim(), 10);
      // Remove the file first so a stale one never lingers, then act on the pid.
      fs.removeSync(pidFile);
      if (pid && isAlive(pid)) {
        log(`stop ${SERVICE_NAMES[serv]}, pid: ${pid}\n`);
        killProcess(pid);
      } else {
        log(`${SERVICE_NAMES[serv]} is not running (removed stale pid file)\n`);
      }
    } else {
      // No pid file - fall back to matching the process by port/command.
      legacyStopByMatch(serv, prod);
    }
  }

  log("Hint: log files are in the folder: " + process.cwd() + "/logs \n");
};
