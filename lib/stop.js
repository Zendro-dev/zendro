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

// Default listen ports, only used to make the "stop it manually" hint concrete
// when no pid was recorded. The real port comes from each sub-project's .env.
const SERVICE_PORTS = {
  gqs: 3000,
  giql: 7070,
  spa: 8080,
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
 * Tell the user how to stop a server we have no recorded pid for. This only
 * happens when nothing was started for it by a pid-aware `zendro start` (e.g. a
 * server left over from an older CLI, or a deleted .zendro directory) - in that
 * case we can't reliably identify the process (a running server doesn't carry
 * its port in its command line), so we point at the port instead of guessing.
 * @param {string} serv service key
 */
function manualStopHint(serv) {
  const port = SERVICE_PORTS[serv];
  const how =
    process.platform === "win32"
      ? `  netstat -ano | findstr :${port}   then   taskkill /f /pid <pid>`
      : `  fuser -k ${port}/tcp   (or: lsof -ti:${port} | xargs kill)`;
  log(
    `${SERVICE_NAMES[serv]}: no recorded pid, nothing to stop.\n` +
      `If a ${SERVICE_NAMES[serv]} server is still running (e.g. started by an ` +
      `older Zendro), stop it manually - it listens on port ${port} by default:\n` +
      `${how}\n`
  );
}

/**
 * Stop Zendro App.
 * @param {[string]} service service names (valid: "gqs", "giql", "spa"); empty
 * means all
 * @param {object} options e.g. { projectDir }. projectDir is the project root
 * to read pids from; it defaults to the current working directory (which is
 * correct when the user runs `zendro stop` from inside the project), but
 * `zendro rm` runs from the parent directory and must pass the project path
 * explicitly - otherwise the pids are looked for in the wrong place.
 */
module.exports = async (service, options) => {
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
    if (!fs.existsSync(pidFile)) {
      manualStopHint(serv);
      continue;
    }

    const pid = parseInt(fs.readFileSync(pidFile, "utf8").trim(), 10);
    // Remove the file first so a stale one never lingers, then act on the pid.
    fs.removeSync(pidFile);
    if (pid && isAlive(pid)) {
      log(`stop ${SERVICE_NAMES[serv]}, pid: ${pid}\n`);
      killProcess(pid);
    } else {
      log(`${SERVICE_NAMES[serv]} is not running (removed stale pid file)\n`);
    }
  }

  log("Hint: log files are in the folder: " + process.cwd() + "/logs \n");
};
