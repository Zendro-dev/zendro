const { csvProcessing, jsonProcessing } = require("zendro-bulk-create");
const fs = require("fs");
const XLSX = require("xlsx");
const { axios_post } = require("../helper");
const inflection = require("inflection");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
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
      const LIMIT_RECORDS = parseInt(process.env.LIMIT_RECORDS || 20);
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
      data_model_definition =
        zendro.models[options.model_name[0].toLowerCase() + options.model_name.slice(1)].definition;
      execute_graphql = zendro.execute_graphql;
      globals = require(process.cwd() + "/config/globals");
    }
    const file_path = options.file_path;
    const file_extension = file_path.split(".").pop().toLowerCase();

    if (file_extension === "csv") {
      let file = fs.createReadStream(file_path);
      try {
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
      } catch (errors) {
        await error_handling(file_path, data_model_definition, errors);
      }
    } else if (file_extension === "xlsx") {
      const work_book = XLSX.readFile(file_path);
      const sheet_name = options.sheet_name ?? work_book.SheetNames[0];
      const work_sheet = work_book.Sheets[sheet_name];
      const records = XLSX.utils.sheet_to_json(work_sheet, { raw: false });
      try {
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
      } catch (errors) {
        await error_handling(file_path, data_model_definition, errors);
      }
    } else if (file_extension === "json") {
      const records = require(file_path);
      try {
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
      } catch (errors) {
        await error_handling(file_path, data_model_definition, errors);
      }
    } else {
      throw new Error("the file extension is not supported!");
    }
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

const error_handling = async (file_path, data_model_definition, errors) => {
  const log_path =
    file_path.split(path.sep).slice(0, -1).join(path.sep) +
    `${path.sep}errors_${uuidv4()}.log`;
  const internalID = data_model_definition.internalId;
  let err_table_header = `record_number\t${
    internalID ? internalID + "\t" : ""
  }fields\terror_message\n`;
  fs.writeFileSync(log_path, err_table_header);
  for (let [num, info] of Object.entries(errors)) {
    let fields = info.errors.errors
      ? new Set(info.errors.errors.map((obj) => obj.instancePath.slice(1)))
      : info.errors.extensions
      ? info.errors.extensions.validationErrors
        ? new Set(
            info.errors.extensions.validationErrors.map((obj) =>
              obj.instancePath.slice(1)
            )
          )
        : undefined
      : undefined;
    const content =
      num +
      `\t${
        internalID
          ? info.errors.input
            ? info.errors.input[internalID] + "\t"
            : info.errors.extensions
            ? info.errors.extensions.input
              ? [info.errors.extensions.input[internalID]] + "\t"
              : JSON.parse(
                  info.subquery
                    .split("(")[1]
                    .split(")")[0]
                    .split(",")
                    .filter((pair) => pair.split(":")[0] === internalID)[0]
                    .split(":")[1]
                ) + "\t"
            : JSON.parse(
                info.subquery
                  .split("(")[1]
                  .split(")")[0]
                  .split(",")
                  .filter((pair) => pair.split(":")[0] === internalID)[0]
                  .split(":")[1]
              ) + "\t"
          : ""
      }` +
      `${fields ? [...fields] : "undefined"}\t` +
      JSON.stringify(
        info.errors.errors ?? info.errors
          ? info.errors.extensions &&
            Object.keys(info.errors.extensions).length > 0
            ? info.errors.message === "validation failed"
              ? info.errors.extensions
              : {
                  message: info.errors.message,
                  ...info.errors.extensions,
                }
            : {
                message: info.errors.toString(),
                ...info.errors,
                ...(info.subquery ? { subquery: info.subquery } : {}),
              }
          : info
      ) +
      "\n";
    fs.writeFileSync(log_path, content, { flag: "a" });
  }
  console.log("There are some errors. Please check the log file:" + log_path);
};
