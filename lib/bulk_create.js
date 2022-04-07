const { csvProcessing, jsonProcessing } = require("zendro-bulk-create");
const fs = require("fs");
const XLSX = require("xlsx");
const { axios_post } = require("../helper");
const inflection = require("inflection");
require("dotenv").config({ path: __dirname + "/../.env.migration" });

module.exports = async (options) => {
  try {
    const remote_mode = options.remote_server;
    let data_model_definition = {};
    let execute_graphql;
    let globals;
    if (remote_mode) {
      const name =
        options.model_name.slice(0, 1).toLowerCase() +
        options.model_name.slice(1);
      const plural_name = inflection.pluralize(name);
      const res = await axios_post(`{${plural_name}ZendroDefinition}`);
      data_model_definition = res.data.data[`${plural_name}ZendroDefinition`];
      execute_graphql = axios_post;
      const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || 200);
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
      data_model_definition =
        zendro.models[options.model_name.toLowerCase()].definition;
      execute_graphql = zendro.execute_graphql;
      globals = require(process.cwd() + "/config/globals");
    }
    const file_path = process.cwd() + "/" + options.file_path;
    const file_extension = file_path.split(".").pop().toLowerCase();

    if (file_extension === "csv") {
      let file = fs.createReadStream(file_path);
      await csvProcessing(
        file,
        data_model_definition,
        true,
        globals,
        execute_graphql
      );
      console.log("finish validation!");
      file = fs.createReadStream(file_path);
      await csvProcessing(
        file,
        data_model_definition,
        false,
        globals,
        execute_graphql
      );
      console.log("finish uploading!");
    } else if (file_extension === "xlsx") {
      const work_book = XLSX.readFile(file_path);
      const sheet_name = options.sheet_name ?? work_book.SheetNames[0];
      const work_sheet = work_book.Sheets[sheet_name];
      const records = XLSX.utils.sheet_to_json(work_sheet, { raw: false });

      await jsonProcessing(
        records,
        data_model_definition,
        true,
        globals,
        execute_graphql
      );
      console.log("finish validation!");
      await jsonProcessing(
        records,
        data_model_definition,
        false,
        globals,
        execute_graphql
      );
      console.log("finish uploading!");
    } else if (file_extension === "json") {
      const records = require(file_path);
      console.log(records);
      await jsonProcessing(
        records,
        data_model_definition,
        true,
        globals,
        execute_graphql
      );
      console.log("finish validation!");
      await jsonProcessing(
        records,
        data_model_definition,
        false,
        globals,
        execute_graphql
      );
      console.log("finish uploading!");
    } else {
      throw new Error("the file extension is not supported!");
    }
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};
