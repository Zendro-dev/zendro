const { spawn_console } = require("../helper");
const { writeFile } = require("fs/promises");
const fs = require("fs-extra");
const path = require("path");

/**
 * Set up a Zendro sandbox.
 * @param {string} name new project name
 */
module.exports = async (name, options) => {
  const dockerize = options.dockerize;
  const new_cmd = dockerize ? ["new", "-d", name] : ["new", name];
  await spawn_console("zendro", new_cmd, {
    cwd: process.cwd(),
  });
  await fs.copy(path.normalize(__dirname + "/../test/data_model_definitions/default/."), path.normalize(`./${name}/data_model_definitions`))

  await spawn_console("zendro", ["generate", "-m"], {
    cwd: path.normalize(process.cwd() + `/${name}`),
  });

  const config = {
    "default-sql": {
      storageType: "sql",
      dialect: "sqlite",
      storage: `data.db`,
    },
  };
  
  await writeFile(
    path.normalize(process.cwd() +
      `/${name}/graphql-server/config/data_models_storage_config.json`),
    JSON.stringify(config)
  );
};
