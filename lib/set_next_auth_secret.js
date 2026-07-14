const { log } = require("../helper");
const fs = require("fs-extra");
const path = require("path");

const SERVICE_ENV_FILES = {
  gqs: {
    dev: "graphql-server/.env",
    prod: "graphql-server/.env"
  },
  spa: {
    dev: "single-page-app/.env.development",
    prod: "single-page-app/.env.production"
  }
};

/**
 * Set NEXTAUTH_SECRET in a single .env file, preserving the existing quote style.
 * @param {string} envPath absolute path to the .env file
 * @param {string} secret the new NEXTAUTH_SECRET value
 */
const setSecretInFile = async (envPath, secret) => {
  if (!(await fs.pathExists(envPath))) {
    log(`Skip ${envPath}, file not found\n`);
    return;
  }

  const content = await fs.readFile(envPath, "utf8");
  const secretLine = /^((?:NEXTAUTH|SESSION)_SECRET)=(["']?).*\2$/m;

  const updated = secretLine.test(content)
    ? content.replace(
        secretLine,
        (_match, key, quote) => `${key}=${quote}${secret}${quote}`
      )
    : content.replace(/\n?$/, () => `\nNEXTAUTH_SECRET='${secret}'\nSESSION_SECRET='${secret}'\n`);

  await fs.writeFile(envPath, updated);
  log(`Updated secret in ${envPath}\n`);
};

/**
 * Set the auth secret for the single-page-app (spa, NEXTAUTH_SECRET) or
 * graphql-server (gqs, SESSION_SECRET - required once AUTH_ENABLED
 * is "true", whether serving gqs's own embedded /graphiql or running
 * login/logout on behalf of the separate graphiql-auth deployment).
 * @param {string} service target service, "spa" or "gqs"
 * @param {string} secret the new secret value
 */
module.exports = async (service, secret, options) => {
  const envFiles = SERVICE_ENV_FILES[service];
  if (envFiles) {
    for (const mode of options.modes) {
      if (typeof envFiles[mode] !== "undefined") {
        await setSecretInFile(path.normalize(process.cwd() + `/${envFiles[mode]}`), secret);
      }
    }
  }
};
