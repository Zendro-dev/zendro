const ora = require("ora");
const { spawn } = require("child_process");
const chalk = require("chalk");
const simpleGit = require("simple-git");
const difftool = require("diff");
const path = require("path");
require("dotenv").config({ path: __dirname + "/.env.migration" });

/**
 * Write log to console with magenta color.
 * @param {string} content the log content
 */
module.exports.log = (content) => console.log(chalk.magentaBright(content));

/**
 * Download a repository with a elegant terminal spinner.
 * @param {string} repo the repository path in gitHub
 * @param {string} dest the destination of downloaded repository
 * @param {string} branch the branch or tag to download
 */
module.exports.clone = async (repo, dest, branch) => {
  const process = ora(`Download ${repo}`);
  console.log(dest);

  process.start();
  try {
    await simpleGit().clone(repo, dest, ['--branch', branch, '--depth', '1', '--recurse-submodules']);
  } catch (error) {
    console.log(error);
    process.fail();
  }
  process.succeed();
};

/**
 * Execute Shell command and pipe output to console
 * @param {...} args the command and its configuration, e.g. work directory
 */
module.exports.spawn_console = async (...args) => {
  return new Promise((resolve) => {
    let [command,arg,options] = args;
    options = {...options, shell: process.platform == 'win32'};
    const proc = spawn(command, arg, options);
    proc.stdout.pipe(process.stdout);
    proc.stderr.pipe(process.stderr);
    proc.on("error", (error) => {
      console.error(chalk.red(`Failed to run "${command}": ${error.message}`));
      resolve(null);
    });
    proc.on("close", (code) => {
      resolve(code);
    });
  });
};

/**
 * Execute Shell command, separate subprocess if necessary
 * @param {boolean} unref the flag for separating the subprocess from the main process
 * @param {...} args the command and its configuration, e.g. environment variables
 */
module.exports.spawn_log = async (unref, ...args) => {
  return new Promise((resolve) => {
    let [command,arg,options] = args;
    options = {...options, shell: process.platform == 'win32'};
    const proc = spawn(command, arg, options);
    if (unref) {
      proc.unref();
    }
    proc.on("error", (error) => {
      console.error(chalk.red(`Failed to run "${command}": ${error.message}`));
      resolve(null);
    });
    proc.on("close", (code) => {
      resolve(code);
    });
  });
};

/**
 * Spawn a detached, long-running service (e.g. a dev/prod server) and return
 * the ChildProcess synchronously so the caller can persist its pid. Unlike
 * spawn_log this does NOT await close - the process is expected to keep
 * running - it only wires up error logging. The child is made a process-group
 * leader (detached) so it and its own children can later be stopped together.
 * @param {...} args the command, its arguments and spawn options
 * @returns {import('child_process').ChildProcess} the spawned child
 */
module.exports.spawn_unref = (...args) => {
  let [command, arg, options] = args;
  options = { ...options, shell: process.platform == "win32", detached: true };
  const proc = spawn(command, arg, options);
  proc.unref();
  proc.on("error", (error) => {
    console.error(chalk.red(`Failed to run "${command}": ${error.message}`));
  });
  return proc;
};

/**
 * Execute Shell commands and save the output as JS string
 * @param {string} cmd1 the first command
 * @param {[string]} arg1 the arguments for the first command
 * @param {string} cmd2 the second command
 * @param {[string]} arg1 the arguments for the second command
 * @param {string} cmd3 the third command
 * @param {[string]} arg1 the arguments for the third command
 * @returns {string} result after the execution of commands
 */
module.exports.spawn_string = async (cmd1, arg1, cmd2, arg2, cmd3, arg3) => {
  return new Promise((resolve, reject) => {
    const proc1 = spawn(cmd1, arg1);
    const proc2 = spawn(cmd2, arg2);
    const proc3 = spawn(cmd3, arg3);

    let output = "";

    proc1.stdout.on("data", (data) => proc2.stdin.write(data));
    proc1.stderr.on("data", (data) => console.error(`${cmd1} stderr: ${data}`));
    proc1.on("close", (code) => {
      if (code !== 0) {
        console.log(`${cmd1} process exited with code ${code}`);
      }
      proc2.stdin.end();
    });

    proc2.stdout.on("data", (data) => proc3.stdin.write(data));
    proc2.stderr.on("data", (data) => console.error(`${cmd2} stderr: ${data}`));
    proc2.on("close", (code) => {
      if (code !== 0) {
        console.log(`${cmd1} process exited with code ${code}`);
      }
      proc3.stdin.end();
    });

    proc3.stdout.on("data", (data) => (output += data.toString()));
    proc3.on("close", () => resolve(output));
    proc3.on("error", (err) => reject(err));
  });
};

/**
 * Compare the actual result with expected result
 * @param {string} actual actual result
 * @param {string} expected expected result
 * @returns {string} comparison report
 */
module.exports.diffByLine = async (actual, expected) => {
  var diff = difftool.diffTrimmedLines(actual, expected);
  //var diff = difftool.diffWords(actual, expected);
  var report = [];

  var lastRemoved = false;
  var lastValue = "";

  diff.forEach((item, i) => {
    if (lastRemoved && item.added) {
      if (lastValue.replace(/\s/g, "") != item.value.replace(/\s/g, "")) {
        //skip whitespace-only differences
        report.push("Actual:   " + lastValue["red"]);
        report.push("Expected: " + item.value["grey"]);
      }
    } else if (!item.added && !item.removed) {
      report.push(item.value["green"]);
    }

    lastRemoved = item.removed;
    lastValue = item.value;
  });

  return report.join("");
};

/**
 * Execute query or mutation and return the response
 * @param {string} query query or mutation
 * @returns {string} response from server
 */
module.exports.axios_post = async (query) => {
  try {
    const OAUTH2_TOKEN_URI = process.env.OAUTH2_TOKEN_URI;
    const username = process.env.USER_NAME;
    const password = process.env.PASSWORD;
    const url = process.env.REMOTE_URL;
    const id = process.env.CLIENT_ID;
    let token;
    if (OAUTH2_TOKEN_URI && username && password && url && id) {
      const tokenResponse = await fetch(OAUTH2_TOKEN_URI, {
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded;charset=utf-8",
        },
        body: `username=${username}&password=${password}&grant_type=password&client_id=${id}`,
      });
      const tokenBody = await tokenResponse.json();
      if (!tokenResponse.ok) {
        throw tokenBody;
      }
      token = tokenBody.access_token;
    }

    let headers = {
      "Content-Type": "application/json",
      Accept: "application/graphql",
    };
    if (token) {
      headers["authorization"] = "Bearer " + token;
    }
    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify({ query: query }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw data;
    }
    return { data };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error);
    } else {
      throw error;
    }
  }
};
