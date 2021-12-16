const { log } = require("../helper");

/**
 * Rollback the last executed migration.
 */
module.exports = async () => {
  const { down } = require(process.cwd() + "/utils/migration.js");
  try {
    await down();
    log("Drop the last executed migration!");
  } catch (error) {
    log(error);
    process.exit(1);
  }
};
