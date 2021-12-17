const { log } = require("../helper");

/**
 * Execute migrations.
 */
module.exports = async () => {
  const { up } = require(process.cwd() + "/utils/migration.js");
  try {
    await up();
    log("Migrated!");
  } catch (error) {
    log(error);
    process.exit(1);
  }
};
