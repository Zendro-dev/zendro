const expect = require("chai").expect;
const assert = require("chai").assert;
const { spawn_console, spawn_log, diffByLine } = require("../helper");
const { readdir, readFile, access } = require("fs/promises");
const fs = require("fs");
const { axios_post } = require("../helper");
const testCompare = async (
  actual,
  expected,
  errorMessage = "Generated output differs from expected"
) => {
  let act = actual.replace(/\s/g, "");
  let exp = expected.replace(/\s/g, "");
  try {
    expect(act, errorMessage).to.have.string(exp);
  } catch (e) {
    console.log("error occurs:");
    report = diffByLine(actual, expected);
    assert.fail(errorMessage + ":\n" + report);
  }
};

describe("Zendro CLI integration tests", () => {
  it("01. zendro new <application_name>", async () => {
    await spawn_console("touch", [`integration_tests.log`], {
      cwd: process.cwd() + `/test`,
    });
    let log_test = fs.openSync(
      process.cwd() + `/test/integration_tests.log`,
      "w"
    );
    await spawn_log(false, "zendro", ["new", "-d", "project"], {
      detached: true,
      stdio: ["ignore", log_test, log_test],
      cwd: process.cwd() + `/test`,
    });
    const first_level = await readdir(process.cwd() + "/test/project");
    const first_level_content = [
      "2021-12-08T17_37_17.804Z#keycloak.js",
      "LICENSE",
      "README.md",
      "config",
      "contexts",
      "data_model_definitions",
      "docker-compose-dev.yml",
      "docker-compose-prod.yml",
      "graphiql-auth",
      "graphql-server",
      "logs",
      "package.json",
      "scripts",
      "single-page-app",
    ];
    expect(first_level).to.eql(first_level_content);

    const env_path = __dirname + "/env";
    await spawn_console("cp", [`${env_path}/.env.gqs`, ".env"], {
      cwd: process.cwd() + `/test/project/graphql-server`,
    });
    await spawn_console(
      "cp",
      [`${env_path}/.env.development.spa`, ".env.development"],
      {
        cwd: process.cwd() + `/test/project/single-page-app`,
      }
    );
    await spawn_console(
      "cp",
      [`${env_path}/.env.production.spa`, ".env.production"],
      {
        cwd: process.cwd() + `/test/project/single-page-app`,
      }
    );

    await spawn_console(
      "cp",
      [`${env_path}/.env.development.giql`, ".env.development"],
      {
        cwd: process.cwd() + `/test/project/graphiql-auth`,
      }
    );
    await spawn_console(
      "cp",
      [`${env_path}/.env.production.giql`, ".env.production"],
      {
        cwd: process.cwd() + `/test/project/graphiql-auth`,
      }
    );
    await spawn_console("cp", [`.env.migration.sample`, ".env.migration"], {
      cwd: process.cwd(),
    });
    const graphiql_auth = await readdir(
      process.cwd() + "/test/project/graphiql-auth"
    );
    const graphiql_auth_content = [
      ".env.development",
      ".env.production",
      ".gitignore",
      "README.md",
      "node_modules",
      "package.json",
      "public",
      "src",
      "yarn.lock",
    ];
    expect(graphiql_auth).to.eql(graphiql_auth_content);
    const graphql_server = await readdir(
      process.cwd() + "/test/project/graphql-server"
    );
    const graphql_server_content = [
      ".env",
      ".gitignore",
      "Dockerfile.graphql_server",
      "LICENSE",
      "README.md",
      "acl_rules.js",
      "config",
      "connection.js",
      "migrateDbAndStartServer.sh",
      "migrations",
      "models",
      "node_modules",
      "package-lock.json",
      "package.json",
      "scripts",
      "server.js",
      "test",
      "utils",
    ];
    expect(graphql_server).to.eql(graphql_server_content);
    const single_page_app = await readdir(
      process.cwd() + "/test/project/single-page-app"
    );
    const single_page_app_content = [
      ".env.development",
      ".env.production",
      ".env.test",
      ".eslintignore",
      ".eslintrc.js",
      ".gitignore",
      ".husky",
      ".prettierrc.js",
      "README.md",
      "acl2.d.ts",
      "babel.config.js",
      "cypress",
      "cypress.json",
      "lint-staged.config.js",
      "next-env.d.ts",
      "next.config.js",
      "node_modules",
      "package.json",
      "public",
      "src",
      "start.sh",
      "test",
      "theme.d.ts",
      "tsconfig.json",
      "yarn.lock",
      "zendro-bulk-create.d.ts",
    ];
    expect(single_page_app).to.eql(single_page_app_content);
  });
  it("02. zendro generate", async () => {
    let log_test = fs.openSync(
      process.cwd() + `/test/integration_tests.log`,
      "a"
    );
    await spawn_console(
      "cp",
      [
        "-r",
        "./data_model_definitions/default/.",
        "./project/data_model_definitions",
      ],
      {
        cwd: process.cwd() + `/test`,
      }
    );
    await spawn_log(false, "zendro", ["generate", "-m"], {
      detached: true,
      stdio: ["ignore", log_test, log_test],
      cwd: process.cwd() + `/test/project`,
    });
    const models = await readdir(
      process.cwd() + "/test/project/graphql-server/models/sql"
    );
    const content = ["city.js", "country.js", "river.js"];
    expect(models).to.eql(content);
  });
  it("03. zendro start [service...] (development mode)", async () => {
    const template = require("./templates/start");
    await spawn_console(
      "cp",
      [
        `./env/data_models_storage_config.json`,
        "./project/graphql-server/config/data_models_storage_config.json",
      ],
      {
        cwd: process.cwd() + `/test`,
      }
    );
    await spawn_console("touch", ["test.db"], {
      cwd: process.cwd() + `/test/env`,
    });

    let log_test = fs.openSync(
      process.cwd() + `/test/integration_tests.log`,
      "a"
    );
    await spawn_log(false, "zendro", ["start"], {
      detached: true,
      stdio: ["ignore", log_test, log_test],
      cwd: process.cwd() + `/test/project`,
    });
    await new Promise((resolve) => setTimeout(resolve, 20000));

    const gqs_log = await readFile(
      __dirname + "/project/logs/graphql-server.log",
      {
        encoding: "utf8",
      }
    );
    await testCompare(gqs_log, template.gqs_dev_keycloak);
    await testCompare(
      gqs_log,
      "nodemon --ignore 'zendro_migration*.json' server.js"
    );
    await testCompare(gqs_log, template.gqs_dev_initialization);

    const giql_log = await readFile(__dirname + "/project/logs/graphiql.log", {
      encoding: "utf8",
    });
    await testCompare(giql_log, template.giql_dev);
    await testCompare(
      giql_log,
      "event - compiled client and server successfully"
    );

    const spa_log = await readFile(
      __dirname + "/project/logs/single-page-app.log",
      {
        encoding: "utf8",
      }
    );
    await testCompare(spa_log, template.spa_dev);
  });
  it("04. zendro stop [service…] (development mode)", async () => {
    const template = require("./templates/stop");
    let log_test = fs.openSync(
      process.cwd() + `/test/integration_tests.log`,
      "a"
    );
    await spawn_log(false, "zendro", ["stop"], {
      detached: true,
      stdio: ["ignore", log_test, log_test],
      cwd: process.cwd() + `/test/project`,
    });
    await new Promise((resolve) => setTimeout(resolve, 3000));
    const gqs_log = await readFile(
      __dirname + "/project/logs/graphql-server.log",
      {
        encoding: "utf8",
      }
    );
    await testCompare(gqs_log, template.gqs_dev);
    const giql_log = await readFile(__dirname + "/project/logs/graphiql.log", {
      encoding: "utf8",
    });
    await testCompare(giql_log, template.giql_dev);
    const spa_log = await readFile(
      __dirname + "/project/logs/single-page-app.log",
      {
        encoding: "utf8",
      }
    );
    await testCompare(spa_log, template.spa_dev);
  });
  it("05. zendro start [service…] (production mode)", async () => {
    const template = require("./templates/start");
    let log_test = fs.openSync(
      process.cwd() + `/test/integration_tests.log`,
      "a"
    );
    await spawn_log(false, "zendro", ["start", "-p"], {
      detached: true,
      stdio: ["ignore", log_test, log_test],
      cwd: process.cwd() + `/test/project`,
    });
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const gqs_log = await readFile(
      __dirname + "/project/logs/graphql-server.log",
      {
        encoding: "utf8",
      }
    );
    const gqs_log_arr = gqs_log.split("\n");
    const parsed_gqs_log = gqs_log_arr
      .slice(gqs_log_arr.length - 50)
      .join("\n");
    await testCompare(parsed_gqs_log, template.gqs_dev_initialization);

    const spa_log = await readFile(
      __dirname + "/project/logs/single-page-app.log",
      {
        encoding: "utf8",
      }
    );
    const spa_log_arr = spa_log.split("\n");
    const parsed_spa_log = spa_log_arr
      .slice(spa_log_arr.length - 50)
      .join("\n");
    await testCompare(parsed_spa_log, template.spa_prod);

    const giql_log = await readFile(__dirname + "/project/logs/graphiql.log", {
      encoding: "utf8",
    });
    const giql_log_arr = giql_log.split("\n");
    const parsed_giql_log = giql_log_arr
      .slice(giql_log_arr.length - 50)
      .join("\n");
    await testCompare(parsed_giql_log, template.giql_prod);
  });
  it("06. zendro stop [service…] (production mode)", async () => {
    const template = require("./templates/stop");
    let log_test = fs.openSync(
      process.cwd() + `/test/integration_tests.log`,
      "a"
    );
    await spawn_log(false, "zendro", ["stop", "-p"], {
      detached: true,
      stdio: ["ignore", log_test, log_test],
      cwd: process.cwd() + `/test/project`,
    });
    await new Promise((resolve) => setTimeout(resolve, 3000));
    const gqs_log = await readFile(
      __dirname + "/project/logs/graphql-server.log",
      {
        encoding: "utf8",
      }
    );
    await testCompare(gqs_log, template.gqs_prod);
    const spa_log = await readFile(
      __dirname + "/project/logs/single-page-app.log",
      {
        encoding: "utf8",
      }
    );
    const spa_log_arr = spa_log.split("\n");
    const parsed_spa_log = spa_log_arr
      .slice(spa_log_arr.length - 50)
      .join("\n");
    await testCompare(parsed_spa_log, template.spa_dev);
    const giql_log = await readFile(__dirname + "/project/logs/graphiql.log", {
      encoding: "utf8",
    });
    const giql_log_arr = giql_log.split("\n");
    const parsed_giql_log = giql_log_arr
      .slice(giql_log_arr.length - 50)
      .join("\n");
    await testCompare(parsed_giql_log, template.giql_dev);
  });
  it("07. zendro migration:down", async () => {
    let log_test = fs.openSync(
      process.cwd() + `/test/integration_tests.log`,
      "a"
    );
    await spawn_log(false, "zendro", ["migration:down"], {
      detached: true,
      stdio: ["ignore", log_test, log_test],
      cwd: process.cwd() + `/test/project/graphql-server`,
    });
    const state = require(__dirname +
      "/project/graphql-server/zendro_migration_state.json");
    const log = require(__dirname +
      "/project/graphql-server/zendro_migration_log.json");
    const file = state["last-executed-migration"]["file"];
    expect(file, "must drop river model").to.have.string("country");
    const log_key = Object.keys(log["migration_log"]).reduce((a, b) => {
      return new Date(a.split("&")[0]) > new Date(b.split("&")[0]) ? a : b;
    });
    const log_value = log["migration_log"][log_key];
    expect(log_value["file"]).to.have.string("river");
    expect(log_value["direction"]).to.have.string("down");
    expect(log_value["result"]).to.have.string("ok");
  });
  it("08. zendro migration:generate", async () => {
    let log_test = fs.openSync(
      process.cwd() + `/test/integration_tests.log`,
      "a"
    );
    await spawn_log(
      false,
      "zendro",
      [
        "migration:generate",
        "-f",
        "../../data_model_definitions/migration_test/river.json",
      ],
      {
        detached: true,
        stdio: ["ignore", log_test, log_test],
        cwd: process.cwd() + `/test/project/graphql-server`,
      }
    );
    const migrations = await readdir(
      process.cwd() + "/test/project/graphql-server/migrations"
    );
    const files = migrations.filter((name) => name.includes("river"));
    expect(files.length).to.eql(2);
    const old_file = files.reduce((a, b) => {
      return new Date(a.split("#")[0].replace(/_/g, ":")) <
        new Date(b.split("#")[0].replace(/_/g, ":"))
        ? a
        : b;
    });
    await spawn_console("rm", [old_file], {
      cwd: process.cwd() + `/test/project/graphql-server/migrations`,
    });
  });
  it("09. zendro migration:up", async () => {
    let log_test = fs.openSync(
      process.cwd() + `/test/integration_tests.log`,
      "a"
    );
    await spawn_log(false, "zendro", ["migration:up"], {
      detached: true,
      stdio: ["ignore", log_test, log_test],
      cwd: process.cwd() + `/test/project/graphql-server`,
    });
    const test_log = await readFile(__dirname + "/integration_tests.log", {
      encoding: "utf8",
    });
    await testCompare(
      test_log,
      "Executing (default): CREATE INDEX `rivers_name` ON `rivers` (`name`)"
    );
  });
  it("10. zendro bulk-create: csv", async () => {
    let log_test = fs.openSync(
      process.cwd() + `/test/integration_tests.log`,
      "a"
    );
    await spawn_log(
      false,
      "zendro",
      ["bulk-create", "-f", "../../env/country.csv", "-n", "country"],
      {
        detached: true,
        stdio: ["ignore", log_test, log_test],
        cwd: process.cwd() + `/test/project/graphql-server`,
      }
    );
    await spawn_log(
      false,
      "zendro",
      ["bulk-create", "-f", "../../env/city.csv", "-n", "city"],
      {
        detached: true,
        stdio: ["ignore", log_test, log_test],
        cwd: process.cwd() + `/test/project/graphql-server`,
      }
    );
    const test_log = await readFile(__dirname + "/integration_tests.log", {
      encoding: "utf8",
    });
    await testCompare(
      test_log,
      "INSERT INTO `countries` (`country_id`,`name`,`river_ids`,`createdAt`,`updatedAt`) VALUES ($1,$2,$3,$4,$5);"
    );
    await testCompare(
      test_log,
      "Executing (default): UPDATE `cities` SET `country_id`=$1,`updatedAt`=$2 WHERE `city_id` = $3"
    );
  });
  it("11. upload csv to remote server", async () => {
    const deleteAssociations = `mutation {
        n0: updateCountry(country_id: "DE", removeCities: ["1", "2", "3"]){countFilteredCities}
        n1: updateCountry(country_id: "CH", removeCities: ["4", "5"]){countFilteredCities}
      }`;
    let res = await axios_post(deleteAssociations);
    expect(res.data.data).to.eql({
      n0: { countFilteredCities: 0 },
      n1: { countFilteredCities: 0 },
    });
    const deleteCountries = `mutation {
        n0: deleteCountry(country_id: "DE")
        n1: deleteCountry(country_id: "CH")
      }`;
    res = await axios_post(deleteCountries);
    expect(res.data.data).to.eql({
      n0: "Item successfully deleted",
      n1: "Item successfully deleted",
    });
    const deleteCities = `mutation {
        n0: deleteCity(city_id: "1")
        n1: deleteCity(city_id: "2")
        n2: deleteCity(city_id: "3")
        n3: deleteCity(city_id: "4")
        n4: deleteCity(city_id: "5")
      }`;
    res = await axios_post(deleteCities);
    expect(res.data.data).to.eql({
      n0: "Item successfully deleted",
      n1: "Item successfully deleted",
      n2: "Item successfully deleted",
      n3: "Item successfully deleted",
      n4: "Item successfully deleted",
    });
    let log_test = fs.openSync(
      process.cwd() + `/test/integration_tests.log`,
      "a"
    );
    await spawn_log(
      false,
      "zendro",
      ["bulk-create", "-f", "./env/country.csv", "-n", "country", "-r"],
      {
        detached: true,
        stdio: ["ignore", log_test, log_test],
        cwd: process.cwd() + `/test`,
      }
    );
    // count records for validation
    res = await axios_post(`{countCountries}`);
    expect(res.data.data).to.eql({
      countCountries: 6,
    });
  });
  it("12. zendro bulk-download", async () => {
    let log_test = fs.openSync(
      process.cwd() + `/test/integration_tests.log`,
      "a"
    );
    await spawn_log(
      false,
      "zendro",
      ["bulk-download", "-f", "../../country_download.csv", "-n", "country"],
      {
        detached: true,
        stdio: ["ignore", log_test, log_test],
        cwd: process.cwd() + `/test/project/graphql-server`,
      }
    );
    const test_log = await readFile(__dirname + "/integration_tests.log", {
      encoding: "utf8",
    });
    await testCompare(
      test_log,
      "Executing (default): SELECT `country_id`, `name`, `population`, `size`, `river_ids`, `capital_id`, `createdAt`, `updatedAt` FROM `countries` AS `country` ORDER BY `country`.`country_id` ASC LIMIT 21;"
    );
    await access(process.cwd() + `/test/country_download.csv`);
    await spawn_console("rm", ["country_download.csv"], {
      cwd: process.cwd() + `/test`,
    });
  });
  it("13. download records from remote server", async () => {
    let log_test = fs.openSync(
      process.cwd() + `/test/integration_tests.log`,
      "a"
    );
    await spawn_log(
      false,
      "zendro",
      [
        "bulk-download",
        "-f",
        "../../country_remote_download.csv",
        "-n",
        "country",
        "-r",
      ],
      {
        detached: true,
        stdio: ["ignore", log_test, log_test],
        cwd: process.cwd() + `/test/project/graphql-server`,
      }
    );
    const csv = await readFile(__dirname + "/country_remote_download.csv", {
      encoding: "utf8",
    });
    await testCompare(csv, '"KR","SouthKorea","NULL","NULL","NULL","NULL",');
    await spawn_console("rm", ["country_remote_download.csv"], {
      cwd: process.cwd() + `/test`,
    });
    const deleteCountries = `mutation {
      n0: deleteCountry(country_id: "DE")
      n1: deleteCountry(country_id: "CH")
    }`;
    res = await axios_post(deleteCountries);
    expect(res.data.data).to.eql({
      n0: "Item successfully deleted",
      n1: "Item successfully deleted",
    });
  });
  it("14. zendro bulk-create: xlsx", async () => {
    let log_test = fs.openSync(
      process.cwd() + `/test/integration_tests.log`,
      "a"
    );
    await spawn_log(
      false,
      "zendro",
      ["bulk-create", "-f", "../../env/country.xlsx", "-n", "country"],
      {
        detached: true,
        stdio: ["ignore", log_test, log_test],
        cwd: process.cwd() + `/test/project/graphql-server`,
      }
    );
    const deleteCountries = `mutation {
        n0: deleteCountry(country_id: "DE")
        n1: deleteCountry(country_id: "CH")
      }`;
    res = await axios_post(deleteCountries);
    expect(res.data.data).to.eql({
      n0: "Item successfully deleted",
      n1: "Item successfully deleted",
    });
  });
  it("15. zendro bulk-create: json", async () => {
    let log_test = fs.openSync(
      process.cwd() + `/test/integration_tests.log`,
      "a"
    );
    await spawn_log(
      false,
      "zendro",
      ["bulk-create", "-f", "../../env/country.json", "-n", "country"],
      {
        detached: true,
        stdio: ["ignore", log_test, log_test],
        cwd: process.cwd() + `/test/project/graphql-server`,
      }
    );
    const deleteCountries = `mutation {
        n0: deleteCountry(country_id: "DE")
        n1: deleteCountry(country_id: "CH")
      }`;
    res = await axios_post(deleteCountries);
    expect(res.data.data).to.eql({
      n0: "Item successfully deleted",
      n1: "Item successfully deleted",
    });
    await spawn_log(false, "zendro", ["stop", "gqs"], {
      detached: true,
      stdio: ["ignore", log_test, log_test],
      cwd: process.cwd() + `/test/project`,
    });
  });
});
