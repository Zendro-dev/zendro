const { bulkDownload } = require("zendro-bulk-create");
const { v4: uuidv4 } = require("uuid");
const { axios_post } = require("../helper");
require("dotenv").config({ path: __dirname + "/../.env.migration" });

module.exports = async (options) => {
  try {
    const remote_mode = options.remote_server;
    let header = "";
    let execute_graphql;
    let globals;
    if (remote_mode) {
      const capital_name =
        options.model_name.slice(0, 1).toUpperCase() +
        options.model_name.slice(1);
      const res = await axios_post(`{csvTableTemplate${capital_name}}`);
      header = res.data.data[`csvTableTemplate${capital_name}`][0];
      execute_graphql = axios_post;
      const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || 20);
      const RECORD_DELIMITER = process.env.RECORD_DELIMITER || "\n";
      const FIELD_DELIMITER = process.env.FIELD_DELIMITER || ",";
      const ARRAY_DELIMITER = process.env.ARRAY_DELIMITER || ";";
      globals = {
        BATCH_SIZE,
        RECORD_DELIMITER,
        FIELD_DELIMITER,
        ARRAY_DELIMITER,
      };
    } else {
      const { initializeZendro } = require(process.cwd() + "/utils/zendro.js");
      const zendro = await initializeZendro();
      header = await zendro.models[
        options.model_name.toLowerCase()
      ].csvTableTemplate();
      header = header[0];
      execute_graphql = zendro.execute_graphql;
      globals = require(process.cwd() + "/config/globals");
    }
    const file_path = options.file_path
      ? process.cwd() + "/" + options.file_path
      : process.cwd() + "/" + options.model_name + uuidv4() + ".csv";

    await bulkDownload(
      options.model_name,
      header,
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
