const figlet = require("figlet");
const { log, spawn_log, clone } = require("../helper");
const fs = require("fs-extra");
const path = require("path");

// A failed `npm install` must not pass unnoticed - otherwise setup carries on
// to `zendro generate`/migrations and only blows up later with a cryptic
// missing-module error (which is how the @vscode/sqlite3 build failure used to
// surface). Native builds like @vscode/sqlite3 (node-gyp) can fail
// intermittently, so retry a couple of times before giving up.
const MAX_INSTALL_ATTEMPTS = 3;

/**
 * Run `npm install` for one sub-project, retrying on failure, and return its
 * final exit code. Output is appended to the sub-project's log file so every
 * attempt is kept for debugging.
 * @param {string} projectName the Zendro project directory name
 * @param {string} subProject the sub-project folder (e.g. "graphql-server")
 * @param {string} logFile the log file name under <project>/logs
 * @param {object} env environment variables for the install
 * @returns {Promise<{subProject: string, code: number|null}>}
 */
async function installSubProject(projectName, subProject, logFile, env) {
  const cwd = path.normalize(process.cwd() + `/${projectName}/${subProject}`);
  const logPath = path.normalize(
    process.cwd() + `/${projectName}/logs/${logFile}`
  );
  let code = null;
  for (let attempt = 1; attempt <= MAX_INSTALL_ATTEMPTS; attempt++) {
    const fd = fs.openSync(logPath, "a");
    code = await spawn_log(false, "npm", ["install"], {
      detached: true,
      stdio: ["ignore", fd, fd],
      cwd,
      env,
    });
    if (code === 0) break;
    if (attempt < MAX_INSTALL_ATTEMPTS) {
      log(
        `install ${subProject}: attempt ${attempt} failed (exit ${code}); ` +
          `retrying - native builds such as @vscode/sqlite3 can fail ` +
          `intermittently...\n`
      );
    }
  }
  return { subProject, code };
}

/**
 * Generate graphql-server code.
 * @param {string} name new project name
 * @param {object} options the options, e.g. keep docker files, which ref of
 * each repo to clone (spaRef/gqsRef/giqlRef - see bin/index.js, defaults to
 * zendro_dependencies.json)
 */
module.exports = async (name, options) => {
  const dockerize = options.dockerize;

  const welcome = await figlet(`Welcome To Zendro!`);
  log("Create new Zendro Project.");
  const prefix = path.normalize(__dirname.slice(0, -4) + "/node_modules/");
  await fs.copy(path.normalize(prefix + "ZendroStarterPack/."), name);

  await clone(
    "https://github.com/Zendro-dev/single-page-app",
    path.normalize(process.cwd() + `/${name}/single-page-app`),
    options.spaRef
  );
  await clone(
    "https://github.com/Zendro-dev/graphql-server",
    path.normalize(process.cwd() + `/${name}/graphql-server`),
    options.gqsRef
  );
  await clone(
    "https://github.com/Zendro-dev/graphiql-auth",
    path.normalize(process.cwd() + `/${name}/graphiql-auth`),
    options.giqlRef
  );

  // create log directory
  await fs.mkdirp(path.normalize(process.cwd() + `/${name}/logs`));
  await fs.mkdirp(path.normalize(process.cwd() + `/${name}/import`));
  await fs.copy(
    path.normalize(
      process.cwd() + `/${name}/2021-12-08T17_37_17.804Z#keycloak.js`
    ),
    path.normalize(
      `${name}/graphql-server/migrations/2021-12-08T17_37_17.804Z#keycloak.js`
    )
  );
  await fs.copy(
    path.normalize(
      process.cwd() + `/${name}/2025-02-23T17_37_17.804Z#schema_to_text_file.js`
    ),
    path.normalize(
      `${name}/graphql-server/migrations/2025-02-23T17_37_17.804Z#schema_to_text_file.js`
    )
  );
  await fs.remove(
    path.normalize(process.cwd() + `/${name}/data_model_definitions/.gitkeep`)
  );
  await fs.remove(path.normalize(process.cwd() + `/${name}/setup.sh`));

  await fs.createFile(path.normalize(`${name}/graphql-server/data.db`));

  await fs.copy(
    path.normalize(process.cwd() + `/${name}/.env.example`),
    path.normalize(process.cwd() + `/${name}/.env`)
  );

  const env_path = path.normalize(__dirname.slice(0, -4) + "/env");
  const env_type = dockerize ? "" : ".no_docker"
  await fs.copy(
    path.normalize(`${env_path}/.env.graphql_server${env_type}`),
    path.normalize(process.cwd() + `/${name}/graphql-server/.env`)
  );
  await fs.copy(
    path.normalize(`${env_path}/.env.development.spa${env_type}`),
    path.normalize(process.cwd() + `/${name}/single-page-app/.env.development`)
  );
  await fs.copy(
    path.normalize(`${env_path}/.env.production.spa${env_type}`),
    path.normalize(process.cwd() + `/${name}/single-page-app/.env.production`)
  );
  await fs.copy(
    path.normalize(`${env_path}/.env.graphiql${env_type}`),
    path.normalize(process.cwd() + `/${name}/graphiql-auth/.env`)
  );

  if (!dockerize) {
    // Copy to a FILE path inside the project, not the project directory
    // itself - fs.copy(file, existingDir) throws "Cannot overwrite directory
    // ... with non-directory". The user then moves this into their Keycloak
    // install's conf folder (see the "without docker" quickstart).
    await fs.copy(
      path.normalize(`${env_path}/../test/env/keycloak.conf`),
      path.normalize(process.cwd() + `/${name}/keycloak.conf`)
    );

    // npm 12 defaults `allow-git` to "none", refusing to install git
    // dependencies (single-page-app pulls one: zendro-bulk-create), which
    // would break these installs on npm 12+. Enable it just for these child
    // processes via env var - a no-op on older npm, and no global npm config
    // is written.
    const npmInstallEnv = { ...process.env, npm_config_allow_git: "all" };

    // The three sub-projects are completely independent, so install them in
    // parallel instead of one after another - the user waits for the slowest
    // install, not the sum of all three. Each writes to its own log file, so
    // the concurrent output never interleaves.
    const subProjects = [
      { name: "graphql-server", log: "graphql-server.log" },
      { name: "single-page-app", log: "single-page-app.log" },
      { name: "graphiql-auth", log: "graphiql.log" },
    ];

    log("install graphql-server, single-page-app and graphiQL packages \n");
    const results = await Promise.all(
      subProjects.map(({ name: subProject, log: logFile }) =>
        installSubProject(name, subProject, logFile, npmInstallEnv)
      )
    );

    const failed = results.filter((result) => result.code !== 0);
    if (failed.length) {
      const list = failed.map((result) => result.subProject).join(", ");
      log(
        `\nERROR: 'npm install' failed for: ${list}.\n` +
          `The project is INCOMPLETE - do not start Zendro yet.\n` +
          `See ./${name}/logs/ for the full npm output. A failed native build ` +
          `(e.g. @vscode/sqlite3) usually means missing build tools - install ` +
          `Python 3, make and a C/C++ compiler (build-essential), then run ` +
          `'npm install' again in the affected folder(s).\n`
      );
      // Exit non-zero so `zendro set-up` stops here instead of running
      // migrations against a half-installed project.
      process.exit(1);
    }

    // remove docker files by default
    log("Remove Docker files.");
    await fs.remove(path.normalize(`${name}/contexts`));
    await fs.remove(path.normalize(`${name}/scripts`));
    await fs.remove(path.normalize(`${name}/docker-compose-dev.yml`));
    await fs.remove(path.normalize(`${name}/docker-compose-prod.yml`));
  }

  log(welcome);
  log(
    "Hints: Please edit the following config files if necessary: \n" +
      "GraphQL Server: ./graphql-server/.env \n" +
      "GraphiQL: ./graphiql-auth/.env \n" +
      "SPA in development mode: ./single-page-app/.env.development \n" +
      "SPA in production mode: ./single-page-app/.env.production \n"
  );
};
