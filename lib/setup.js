const { log, spawn_console } = require("../helper");
const { writeFile } = require("fs/promises");
const fs = require("fs-extra");
const path = require("path");

/**
 * Set up a Zendro sandbox.
 * @param {string} name new project name
 */
module.exports = async (name, options) => {
  const dockerize = options.dockerize;
  const new_cmd = [
    "new",
    ...(dockerize ? ["-d"] : []),
    "--spa-ref", options.spaRef,
    "--gqs-ref", options.gqsRef,
    "--giql-ref", options.giqlRef,
    name,
  ];
  const new_code = await spawn_console("zendro", new_cmd, {
    cwd: process.cwd(),
  });
  if (new_code !== 0) {
    log(
      `\nSet-up aborted: 'zendro new' failed (exit ${new_code}). ` +
        `See the messages above and ./${name}/logs/ for details.\n`
    );
    process.exit(new_code || 1);
  }

  await fs.copy(path.normalize(__dirname + "/../test/data_model_definitions/default/."), path.normalize(`./${name}/data_model_definitions`))

  const generate_code = await spawn_console("zendro", ["generate", "-m"], {
    cwd: path.normalize(process.cwd() + `/${name}`),
  });
  if (generate_code !== 0) {
    log(
      `\nSet-up aborted: 'zendro generate' failed (exit ${generate_code}). ` +
        `See the messages above and ./${name}/logs/ for details.\n`
    );
    process.exit(generate_code || 1);
  }

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
