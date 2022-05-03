const { spawn_console } = require("../helper");
const { writeFile } = require("fs/promises");
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
  await spawn_console(
    "cp",
    [
      "-r",
      __dirname + "/../test/data_model_definitions/default/.",
      `./${name}/data_model_definitions`,
    ],
    {
      cwd: process.cwd(),
    }
  );
  await spawn_console("zendro", ["generate", "-m"], {
    cwd: process.cwd() + `/${name}`,
  });

  await spawn_console("touch", [`data.db`], {
    cwd: process.cwd() + `/${name}/graphql-server`,
  });

  const config = {
    "default-sql": {
      storageType: "sql",
      dialect: "sqlite",
      storage: `data.db`,
    },
  };
  await writeFile(
    process.cwd() +
      `/${name}/graphql-server/config/data_models_storage_config.json`,
    JSON.stringify(config)
  );
};
