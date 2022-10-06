const fs = require("fs-extra");
const path = require("path");
const { spawn_console, log } = require("../helper");

/**
 * Dockerize Zendro App.
 */
module.exports = async (options) => {
  const up = options.up;
  const down = options.down;
  const prod = options.prod;
  const volume = options.volume;
  const file = prod ? "docker-compose-prod.yml" : "docker-compose-dev.yml";
  if (up) {
    // dockerize Zendro App
    await spawn_console(
      "docker-compose",
      ["-f", file, "up", "-d", "--force-recreate", "--remove-orphans"],
      { cwd: process.cwd() }
    );
  } else if (down) {
    const parameters = volume
      ? ["-f", file, "down", "--remove-orphans", "-v"]
      : ["-f", file, "down", "--remove-orphans"];
    await spawn_console("docker-compose", parameters, {
      cwd: process.cwd(),
    });
    if (volume) {
      await fs.remove(path.normalize(process.cwd() + "/graphql-server/zendro_migration_log.json"));
      await fs.remove(path.normalize(process.cwd() + "/graphql-server/zendro_migration_state.json"));
    }
  } else {
    log("Please specify an option: -u or -d");
  }
};
