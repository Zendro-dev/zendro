const { bulkDownload } = require("zendro-bulk-create");
const { v4: uuidv4 } = require("uuid");
const { axios_post } = require("../helper");
const inflection = require("inflection");
const path = require("path");
require("dotenv").config({ path: __dirname + "/../.env.migration" });

module.exports = async (options) => {
  try {
    const remote_mode = options.remote_server;
    let header = "";
    let definition;
    let execute_graphql;
    let globals;
    if (remote_mode) {
      const plural_name = inflection.pluralize(
        options.model_name.slice(0, 1).toLowerCase() +
          options.model_name.slice(1)
      );
      const res = await axios_post(`{${plural_name}ZendroDefinition}`);
      definition = res.data.data[`${plural_name}ZendroDefinition`];
      execute_graphql = axios_post;
      const LIMIT_RECORDS = parseInt(process.env.LIMIT_RECORDS || 10000);
      const RECORD_DELIMITER = process.env.RECORD_DELIMITER || "\n";
      const FIELD_DELIMITER = process.env.FIELD_DELIMITER || ",";
      const ARRAY_DELIMITER = process.env.ARRAY_DELIMITER || ";";
      globals = {
        LIMIT_RECORDS,
        RECORD_DELIMITER,
        FIELD_DELIMITER,
        ARRAY_DELIMITER,
      };
    } else {
      const { initializeZendro } = require(process.cwd() + "/utils/zendro.js");
      const zendro = await initializeZendro();
      definition = await zendro.models[options.model_name[0].toLowerCase() + options.model_name.slice(1)].definition;
      execute_graphql = zendro.execute_graphql;
      globals = require(process.cwd() + "/config/globals");
    }

    const attributes = Object.keys(definition.attributes);
    let addAssociations = {};
    const associations = definition.associations;
    if (associations) {
      for (const [assocName, assocObj] of Object.entries(associations)) {
        let addAssocName =
          "add" + assocName.slice(0, 1).toUpperCase() + assocName.slice(1);
        if (assocObj.sourceKey) {
          addAssociations[assocObj.sourceKey] = addAssocName;
        } else if (assocObj.keysIn === options.model_name) {
          addAssociations[assocObj.targetKey] = addAssocName;
        }
      }
    }
    const foreignKeys = Object.keys(addAssociations);
    for (let attr of attributes) {
      if (foreignKeys.includes(attr)) {
        header += addAssociations[attr] + globals.FIELD_DELIMITER;
      } else {
        header += attr + globals.FIELD_DELIMITER;
      }
    }
    header = header.slice(0, -1);

    const file_path = options.file_path
      ? path.resolve(options.file_path)
      : path.resolve(
          process.cwd() + "/" + options.model_name + uuidv4() + ".csv"
        );

    await bulkDownload(
      options.model_name,
      header,
      attributes,
      globals,
      execute_graphql,
      false,
      file_path
    );
    console.log("finish!");
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};
