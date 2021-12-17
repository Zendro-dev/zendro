const fs = require("fs").promises;
const { spawn_console } = require("../helper");

/**
 * Generate graphql-server code.
 * @param {object} options the options, e.g. output directory
 */
module.exports = async (options) => {
  const def_path =
    options.data_model_definitions.length === 0
      ? [process.cwd() + "/../data_model_definitions"]
      : options.data_model_definitions.map(
          (folder) => process.cwd() + "/" + folder
        );

  let output_dir;
  if (options.output_dir) {
    const directories = options.output_dir.split("/").filter((x) => x != "");
    if (directories[directories.length - 1] != "migrations") {
      output_dir = process.cwd() + "/" + options.output_dir;
    } else {
      output_dir =
        process.cwd() +
        "/" +
        directories.slice(0, directories.length - 1).join("/");
    }
  } else {
    output_dir = process.cwd() + "/";
  }
  const tmp_dir = "../tmp_dir";
  const gqs_code_gen_path =
    __dirname.slice(0, -4) +
    "/node_modules/graphql-server-model-codegen/index.js";

  // create a temporary directory for saving schema files
  await spawn_console("mkdir", [tmp_dir]);
  for (let path of def_path) {
    if (path.slice(-5).toLowerCase() === ".json") {
      // copy single schema file to the temporary directory
      await spawn_console("cp", [path, tmp_dir]);
    } else {
      let args = [
        gqs_code_gen_path,
        "-f",
        path,
        "-o",
        output_dir,
        "-m",
        "-b",
      ].concat(options.args);

      // generate code for files in provided directory
      await spawn_console("node", args);
    }
  }

  const files = await fs.readdir(tmp_dir);
  // generate code if the temporary directory is not empty
  if (files.length) {
    let args = [
      gqs_code_gen_path,
      "-f",
      tmp_dir,
      "-o",
      output_dir,
      "-m",
      "-b",
    ].concat(options.args);

    await spawn_console("node", args);
  }
  // remove the temporary directory
  await spawn_console("rm", ["-r", tmp_dir]);
};