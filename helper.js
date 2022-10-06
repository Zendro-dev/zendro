const ora = require("ora");
const { spawn } = require("child_process");
const chalk = require("chalk");
const { promisify } = require("util");
const download = promisify(require("download-git-repo"));
const axios = require("axios");
const difftool = require("diff");
require("dotenv").config({ path: __dirname + "/.env.migration" });
/**
 * Write log to console with magenta color.
 * @param {string} content the log content
 */
module.exports.log = (content) => console.log(chalk.magentaBright(content));

/**
 * Download a repository with a elegant terminal spinner.
 * @param {string} repo the repository path in gitHub
 * @param {string} desc the destination of downloaded repository
 */
module.exports.clone = async (repo, desc) => {
  const process = ora(`Download ${repo}`);
  console.log(desc);

  process.start();
  try {
    await download(repo, desc);
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
    proc.on("close", () => {
      resolve();
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
    proc.on("close", () => {
      resolve();
    });
  });
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
    const res = await axios({
      method: "post",
      url: OAUTH2_TOKEN_URI,
      data: `username=${username}&password=${password}&grant_type=password&client_id=${id}`,
      headers: {
        "content-type": "application/x-www-form-urlencoded;charset=utf-8",
      },
    });
    if (res && res.data) {
      const token = res.data.access_token;
      try {
        const response = await axios.post(
          url,
          { query: query },
          {
            headers: {
              "Content-Type": "application/json",
              Accept: "application/graphql",
              authorization: "Bearer " + token,
            },
          }
        );
        return response;
      } catch (error) {
        throw new Error(error);
      }
    } else {
      throw new Error("No api token found");
    }
  } catch (error) {
    throw new Error(error);
  }
};
