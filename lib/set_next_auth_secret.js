const { log } = require("../helper");
const fs = require("fs-extra");
const path = require("path");

const SERVICE_ENV_FILES = {
  giql: {
    dev: "graphiql-auth/.env.development",
    prod: "graphiql-auth/.env.production"
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
  const secretLine = /^NEXTAUTH_SECRET=(["']?).*\1$/m;

  const updated = secretLine.test(content)
    ? content.replace(
        secretLine,
        (_match, quote) => `NEXTAUTH_SECRET=${quote}${secret}${quote}`
      )
    : content.replace(/\n?$/, () => `\nNEXTAUTH_SECRET='${secret}'\n`);

  await fs.writeFile(envPath, updated);
  log(`Updated NEXTAUTH_SECRET in ${envPath}\n`);
};

/**
 * Set the NEXTAUTH_SECRET for the single-page-app (spa) or graphiql-auth (giql) server.
 * @param {string} service target service, "spa" or "giql"
 * @param {string} secret the new NEXTAUTH_SECRET value
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
