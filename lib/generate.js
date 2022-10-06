const fs = require("fs-extra");
const { spawn_console } = require("../helper");
const path = require("path");

/**
 * Generate graphql-server code.
 * @param {object} options the options, e.g. output directory
 */
module.exports = async (options) => {
  const def_path =
    options.data_model_definitions.length === 0
      ? [path.normalize(process.cwd() + "/data_model_definitions")]
      : options.data_model_definitions.map(
          (folder) => path.normalize(process.cwd() + "/" + folder)
        );
  const output_dir = options.output_dir
    ? path.normalize(process.cwd() + "/" + options.output_dir)
    : path.normalize(process.cwd() + "/graphql-server");
  const migrations = options.migrations;
  const tmp_dir = path.normalize("../tmp_dir");
  const gqs_code_gen_path =
    path.normalize(__dirname.slice(0, -4) +
    "/node_modules/graphql-server-model-codegen/index.js");

  // create a temporary directory for saving schema files
  await fs.mkdir(tmp_dir);

  for (let p of def_path) {
    if (p.slice(-5).toLowerCase() === ".json") {
      // copy single schema file to the temporary directory
      await fs.copy(p,tmp_dir);
    } else {
      let args = [gqs_code_gen_path, "-f", p, "-o", output_dir].concat(
        options.args
      );
      // generate migrations if necessary
      if (migrations) {
        args.push("-m");
      }
      // generate code for files in provided directory
      await spawn_console("node", args);
    }
  }
  
  const files = await fs.readdir(tmp_dir);
  // generate code if the temporary directory is not empty
  if (files.length) {
    let args = [gqs_code_gen_path, "-f", tmp_dir, "-o", output_dir].concat(
      options.args
    );
    if (migrations) {
      args.push("-m");
    }
    await spawn_console("node", args);
  }
  // remove the temporary directory
  await fs.remove(tmp_dir);
};
