const fs = require("fs-extra");
const path = require("path");
const { spawn_console, log } = require("../helper");

const SERVICES = {
  spa: ["zendro-spa-install", "zendro-spa"],
  gqs: ["zendro-graphql-server"],
  giql: ["zendro-graphiql-install", "zendro-graphiql"]
}

/**
 * Dockerize Zendro App.
 */
module.exports = async (services, options) => {
  const up = options.up;
  const down = options.down;
  const prod = options.prod;
  const volume = options.volume;
  const file = prod ? "docker-compose-prod.yml" : "docker-compose-dev.yml";
  const UID_GID = `${process.getuid()}:${process.getgid()}`;

  const servicesToStart = services.reduce((a, b) => a.concat(SERVICES[b]), [])
  if (servicesToStart.length) {
    servicesToStart.push("zendro-cache-init", "zendro-graphql-server-migrations")
  }
  servicesToStart.push("zendro-keycloak-postgres", "zendro-keycloak")

  if (up) {
    // dockerize Zendro App
    await spawn_console(
      "docker",
      ["compose", "-f", file, "up", "-d", "--force-recreate", "--remove-orphans", ...servicesToStart],
      {
        cwd: process.cwd(),
        env: { ...process.env, UID_GID: UID_GID },
      }
    );
  } else if (down) {
    const parameters = volume
      ? ["compose", "-f", file, "down", "--remove-orphans", "-v"]
      : ["compose", "-f", file, "down", "--remove-orphans"];
    await spawn_console("docker", [...parameters, ...servicesToStart], {
      cwd: process.cwd(),
      env: { ...process.env, UID_GID: UID_GID },
    });
    if (volume) {
      await fs.remove(
        path.normalize(
          process.cwd() + "/graphql-server/zendro_migration_log.json"
        )
      );
      await fs.remove(
        path.normalize(
          process.cwd() + "/graphql-server/zendro_migration_state.json"
        )
      );
    }
  } else {
    log("Please specify an option: -u or -d");
  }
};
