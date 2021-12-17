const { spawn_console, log } = require("../helper");

/**
 * Dockerize Zendro App.
 */
module.exports = async (options) => {
  const up = options.up;
  const down = options.down;
  const prod = options.prod;
  const file = prod ? "docker-compose-prod.yml" : "docker-compose-dev.yml";
  if (up) {
    // dockerize Zendro App
    await spawn_console("rm", ["-rf", "zendro_migration_log.json"], {
      cwd: process.cwd() + `/graphql-server`,
    });
    await spawn_console("rm", ["-rf", "zendro_migration_state.json"], {
      cwd: process.cwd() + `/graphql-server`,
    });
    await spawn_console(
      "sudo",
      [
        "docker-compose",
        "-f",
        file,
        "up",
        "-d",
        "--force-recreate",
        "--remove-orphans",
      ],
      { cwd: process.cwd() }
    );
  } else if (down) {
    await spawn_console(
      "docker-compose",
      ["-f", file, "down", "--remove-orphans", "-v"],
      {
        cwd: process.cwd(),
      }
    );
    await spawn_console("rm", ["-rf", "zendro_migration_log.json"], {
      cwd: process.cwd() + `/graphql-server`,
    });
    await spawn_console("rm", ["-rf", "zendro_migration_state.json"], {
      cwd: process.cwd() + `/graphql-server`,
    });
  } else {
    log("Please specify an option: -u or -d");
  }
};
