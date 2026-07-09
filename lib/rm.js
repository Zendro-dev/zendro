const { log, spawn_console } = require("../helper");
const fs = require("fs-extra");
const path = require("path");
const readline = require("readline");

/**
 * Ask the user a yes/no question on the terminal.
 * @param {string} question the question to display
 * @returns {boolean} whether the user confirmed
 */
const confirm = async (question) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const answer = await new Promise((resolve) => rl.question(question, resolve));
  rl.close();
  return /^y(es)?$/i.test(answer.trim());
};

/**
 * Delete a Zendro project, including its docker containers, project-built
 * images and named volumes.
 * @param {string} name the project name (a subdirectory of cwd)
 * @param {object} options CLI options, e.g. force
 */
module.exports = async (name, options) => {
  const force = options.force;
  const projectPath = path.normalize(process.cwd() + `/${name}`);

  if (!(await fs.pathExists(projectPath))) {
    log(`No such project: ${projectPath}\n`);
    return;
  }

  if (!force) {
    const proceed = await confirm(
      `This will permanently delete the project "${name}" (${projectPath}), ` +
        `including its docker images and volumes. Continue? (y/N) `
    );
    if (!proceed) {
      log("Aborted.\n");
      return;
    }
  }

  // dev and prod compose files define the same container names, build
  // targets and named volumes, so tearing down either one is enough to
  // pick up all project-scoped docker resources.
  const composeFile = ["docker-compose-dev.yml", "docker-compose-prod.yml"].find(
    (file) => fs.pathExistsSync(path.normalize(`${projectPath}/${file}`))
  );

  if (composeFile) {
    log(`Remove docker containers, project images and volumes...\n`);
    const UID_GID = `${process.getuid()}:${process.getgid()}`;
    const code = await spawn_console(
      "docker",
      [
        "compose",
        "-f",
        composeFile,
        "down",
        // only remove images built for this project (no image: tag), not
        // pulled base images like postgres/keycloak that other projects
        // may still rely on
        "--rmi",
        "local",
        "--volumes",
        "--remove-orphans",
      ],
      {
        cwd: projectPath,
        env: { ...process.env, UID_GID: UID_GID },
      }
    );
    if (code !== 0) {
      log(
        `Docker cleanup did not complete successfully. ` +
          `You may need to remove leftover images/volumes for "${name}" manually.\n`
      );
    }
  }

  log(`Remove project directory: ${projectPath}\n`);
  try {
    await fs.remove(projectPath);
  } catch (error) {
    if (error.code === "EACCES" || error.code === "EPERM") {
      log(
        `Permission denied while deleting ${projectPath}\n` +
          `Some files were likely created by a docker container running as root. ` +
          `Please remove them manually with:\n` +
          `  sudo rm -rf "${projectPath}"\n`
      );
      return;
    }
    throw error;
  }

  log(`Removed project "${name}".\n`);
};
