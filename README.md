# Zendro Command Line Interface (CLI)
## Introduction
A CLI for building Zendro Sandbox.

## Installation
A quick installation would be this command: `npm install -g Zendro-dev/zendro`.
However, if you would like to customize your Zendro CLI, you can set it up as the following:
```
$ git clone https://github.com/Zendro-dev/zendro.git
$ cd zendro
$ npm install
$ npm link
```
For example, you can customize the version of each repository by editing `zendro_dependencies.json` file in your local Zendro CLI repository.

## Commands
### zendro new <your_application_name>
Start a new application:
1. copy starter pack to folder <your_application_name>
2. clone `single-page-app` & `graphql-server` & `graphiql-auth` repositories from GitHub (version: see `zendro_dependencies.json`)
3. install packages for each repository
4. create templates of environment variables for each repository
5. **-d** or **--dockerize**: keep Dockerfiles (default: false). Set to be true, keep Dockerfiles. Default: remove Dockerfiles and initUserDb.sh
6. a welcome interface
7. hints: edit config files if necessary. And there are two example files for the configuration of all supported storage types with docker setup, namely `./config/data_models_storage_config_example.json` and `./docker-compose-dev-example.yml`

* without docker setup: ./graphql-server/config/data_models_storage_config.json
* with docker setup: ./config/data_models_storage_config.json
* ./graphql-server/.env
* SPA in development mode: ./single-page-app/.env.development
* SPA in production mode: ./single-page-app/.env.production
* GraphiQL in development mode: ./graphql-server/.env.development 
* GraphiQL in production mode: ./graphql-server/.env.production

### zendro generate
Generate code for graphql-server.
1. **-f** or **--data_model_definitions**: input directory or a JSON file (default: current directory path + "/data_model_definitions")
2. **-o** or **--output_dir**: output directory (default: current directory path + "/graphql_server")
3. **-m** or **--migrations**: generate migrations (default: false). Set to be true, generate migrations
4. allow unknown options

### zendro dockerize 
Dockerize Zendro App with example docker files.
1. **-u** or **--up**: start docker service
* set the host of Postgres as sdb_postgres
2. **-d** or **--down**: stop docker service
3. **-p** or **--production**: start or stop GQS and SPA with production mode

### zendro start [service...]
Start Zendro service.
1. default: start all service
2. **-p** or **--production**: start GQS and SPA with production mode
3. start specified service with the following abbreviations:
* gqs: graphql-server
* spa: single-page-app
* giql:graphiql

### zendro stop [service…]
Stop Zendro service.
1. default: stop all service
2. **-p** or **--production**: stop GQS and SPA with production mode
3. stop specified service with abbreviations

### zendro migration:generate
Generate migration code for graphql-server.
1. **-f** or **--data_model_definitions**: input directory or a JSON file (default: current directory path + "/../data_model_definitions")
2. **-o** or **--output_dir**: output directory (default: current directory path + "/migrations")
Note: all generated migrations would be stored in a directory called `migrations`.

### zendro migration:up
Execute migrations which are generated after the last executed migration.

Note: the last executed migration is recorded in `zendro_migration_state.json` and the log of migrations is in the file `zendro_migration_log.json`.

### zendro migration:down
Drop the last executed migration.


### zendro bulk-create
parse a file and upload parsed records to graphql-server
1. **-f** or **--file_path**: file path. Supported file format: CSV, XLSX, JSON
2. **-n** or **--model_name**: model name.
3. **-s** or **--sheet_name**: sheet name for XLSX file. By default process the first sheet.
4. **-r** or **--remote_server**: upload to a remote server (default: false).

### zendro set-up <name>
set up a sandbox with default data models and SQLite
1. **-d** or **--dockerize**: Keep Docker files (default: false).

## A Quick Example for setting up a Zendro Sandbox
1. By default, three data models with associations would be used for this sandbox, namely city, country and river. And a default SQLite database would be used.
2. Execute `zendro set-up -d <name>`, edit NEXTAUTH_SECRET to your expect secret and modify other environment variables if necessary in the following config files:
* SPA in development mode: ./single-page-app/.env.development
* SPA in production mode: ./single-page-app/.env.production
* GraphiQL in development mode: ./graphql-server/.env.development 
* GraphiQL in production mode: ./graphql-server/.env.production
If you would like to upload a file to a remote server, please consider the template `.env.migration.sample`, create a new file `.env.migration` and modify relevant environment variables.
3. Execute `zendro dockerize -u -p`, then zendro instance with production mode would start.
4. Execute `zendro dockerize -d -p -v`, then zendro instance would stop and all volumes would be removed.

## A Detailed Example for setting up a Zendro Instance
1. create a new application (**test**). Keep docker files (**-d**) by executing  __`zendro new -d test`__. If you want to modify some environment variables, please edit relevant files, which are also specified in the console.
* without docker setup: ./graphql-server/config/data_models_storage_config.json
* with docker setup: ./config/data_models_storage_config.json
* ./graphql-server/.env
* SPA in development mode: ./single-page-app/.env.development
* SPA in production mode: ./single-page-app/.env.production
* GraphiQL in development mode: ./graphql-server/.env.development 
* GraphiQL in production mode: ./graphql-server/.env.production

Note: if you would like to upload a file to a remote server, please consider the template `.env.migration.sample`, create a new file `.env.migration` and modify relevant environment variables. By default, SQLite3 would be used for the data storage. If you want to use other storage types, then you can reuse part of two example files, which illustrate the configuration of all supported storage types with docker setup, namely `./config/data_models_storage_config_example.json` and `./docker-compose-dev-example.yml`. 

2. __cd test__

3. add JSON files for model definitions in `./data_model_definitions` folder and generate graphql-server (GQS) code and migrations by executing __`zendro generate -m`__

4. if you prefer to use local setup with Keycloak, you can start all service by executing **`zendro start`**. And an example configuration file for Keycloak is `./test/env/keycloak.conf`. By default Keycloak would use H2 database to store information. Moreover, the default database for records in Zendro would be a SQLite3 database. Its configuration is in this file: `./graphql-server/config/data_models_storage_config.json`. If user would like to add other storage types, it is necessary to edit this file. Meanwhile, if you would like to use production mode, please add `-p` option.
   
5. stop all running service by executing **`zendro stop`**. Besides, if you would like to stop production mode, please add `-p` option.

6. If you don't have local setup with keycloak, you can play with Zendro by dockerizing example Zendro App. The command would be **`zendro dockerize -u`**. Moreover, if you would like to use production mode, please execute **`zendro dockerize -u -p`**. Besides, the default username is `zendro-admin` and the corresponding password is `admin`. 

7. When you want to stop docker service, you can execute **`zendro dockerize -d`**. In addition, if your services are in production mode, please execute **`zendro dockerize -d -p`**. 

## Example for Migrations
If a user has new data model definitions, it is convinient to use Zendro CLI for dealing with migrations. And the following procedure shows how to generate, perform or drop migrations:
1. in `graphql-server` folder, execute `zendro migration:generate -f <data_model_definitions>`. The migrations are automatically generated in the `/graphql-server/migrations` folder. By default, every migration file has two functions, namely `up` and `down`. The `up` function creates a table, the `down` function deletes the existing table. Furthermore it is possible to customize the migration functions.
2. in `graphql-server` folder, it is possible to perform new generated migrations, which are generated after the last executed migration, by executing `zendro migration:up`. After that, the last executed migration and migration log are updated.
3. in `graphql-server` folder, the last executed migration can be dropped by executing `zendro migration:down`. This will update the latest successful migration and add the dropped operation to the migration log. If there are some remaining records and associations in the table, by default an error is thrown. To forcefully drop the table, in spite of remaining records, set the environment variable `DOWN_MIGRATION` to `true` in `/graphql-server/.env` file and re-execute this down-migration.

Note: for all `up` and `down` functions, there is a default argument called `zendro`. It provides the access to different APIs in zendro layers (resolvers, models, adapters) and enables graphql queries. In model and adapter levels zendro can also access the storage handler which can interact with corresponding database management system. Following are some examples for model `movie` and adapter `dist_movie_instance1`.
```
await zendro.models.movie.storageHandler;
await zendro.models.movie.countRecords();
await zendro.adapters.dist_movie_instance1.storageHandler;
await zendro.adapters.dist_movie_instance1.countRecords();
```
At the resolver level the `zendro` argument exposes the corresponding API functions , e.g. `readOneMovie`, `countMovies` and so on. Those functions expect a `context` which needs to be provided like in the example below. This includes an event emitter to collect any occurring errors. See the following example for using `countMovies` API via `zendro`:
```
const {
  BenignErrorArray,
} = require("./graphql-server/utils/errors.js");
let benign_errors_arr = new BenignErrorArray();
let errors_sink = [];
let errors_collector = (err) => {
  errors_sink.push(err);
};
benign_errors_arr.on("push", errors_collector);
const res = await zendro.resolvers.countMovies(
  { search: null },
  {
    request: null, // by default the token is null
    acl: null,
    benignErrors: benign_errors_arr, // collect errors
    recordsLimit: 15,
  }
);
```
Moreover, it is possible to execute graphql queries or mutations via `execute_graphql(query, variables)` function. Specifically, the `query` argument refers to the query string and the `variable` argument represents dynamic values for that query. By default, queries would be executed without token, however in a distributed setup with ACL rules a token is necessary for sending queries. To obtain that token from keycloak the `MIGRATION_USERNAME` and `MIGRATION_PASSWORD` environment variables are needed. The function can then be used as follows:
```
await zendro.execute_graphql("{ countMovies }");
```

## Uploading a File
### Data format requirements
Data to populate each model in your schema must be in a separate CSV file, following the format requirements below:
1. Column names in the first row must correspond to model attributes. And for associations, the format of a column name is like `add<associationName>`, e.g. `addCountries` for assciationName `countries`.
2. Empty values should be represented as `"NULL"`.
3. All fields should be quoted by `"`. However, if field delimiter and array delimiter do not occur in fields with String type, namely characters could be split without ambiguity, then no quotes are necessary. For example, if the field delimiter is `,` and one String field is like `Zendro, excellent!`, then without the quotation mark, this field will be split as two fields. So in such case these String fields must be quoted.
4. Default configuration: LIMIT_RECORDS=10000, RECORD_DELIMITER="\n", FIELD_DELIMITER=",", ARRAY_DELIMITER=";". They can be changed in the config file for environment variables.
5. Date and time formats must follow the [RFC 3339](https://tools.ietf.org/html/rfc3339) standard.

### Examples
There are two ways to upload a file via zendro CLI:
1. If the Zendro instance is on your local machine, you can directly go into the folder `graphql-server` and execute
`zendro bulk-create -f <filename> -n <modelname> -s <sheetname>`, e.g. `zendro bulk-create -f ./country.csv -n country`. Three formats are supported here, namely CSV, XLSX and JSON. And the paramter `sheetname` is only used for XLSX file. If it is empty, by default records in the first sheet would be imported. And the default configuration for delimiters and record limit, you can find them in `graphql-server/.env`.
2. If you want to upload a file to a remote Zendro server, it is also possible via Zendro CLI. All configuration could be modified in the file `zendro/.env.migration`. After the configuration, you can execute `zendro bulk-create -f <filename> -n <modelname> -s <sheetname> -r`, e.g. `zendro bulk-create -f ./country.csv -n country -r`.

Note: if the validation of records fails, the log file would be stored in the folder of the uploaded file and its name would be like `errors_<uuid>.log`.

## Download Records
In general, it is possible to download all data into CSV format in two ways, either using the Zendro CLI or the Zendro Single Page App. Here every attribute will be quoted to avoid ambiguity and enable seamless integration with the zendro bulk creation functionalities. And column names for foreign keys would be like `add<associationName>`. For example, there is an association named `countries`, which includes a foreign key called `country_ids`, then the column name for `country_id` should be `addCountries`.

1. If the Zendro instance is installed locally, then user can execute the command in the `graphql-server` folder: `zendro bulk-download -f <filename> -n <modelname>`. To configure delimiters (`ARRAY_DELIMITER`, `FIELD_DELIMITER` and `RECORD_DELIMITER`) and record-limit (`LIMIT_RECORDS`), set the according environment variables in  `graphql-server/.env`

2. If the Zendro instance is accessible remotely, modify the `zendro/.env.migration` configuration file to map to the remote Zendro instance. After that, execute `zendro bulk-create -f <filename> -n <modelname> -r` to download the records to CSV.

## Contributions
Zendro is the product of a joint effort between the Forschungszentrum Jülich, Germany and the Comisión Nacional para el Conocimiento y Uso de la Biodiversidad, México, to generate a tool that allows efficiently building data warehouses capable of dealing with diverse data generated by different research groups in the context of the FAIR principles and multidisciplinary projects. The name Zendro comes from the words Zenzontle and Drossel, which are Mexican and German words denoting a mockingbird, a bird capable of “talking” different languages, similar to how Zendro can connect your data warehouse from any programming language or data analysis pipeline.

### Zendro contributors in alphabetical order
Francisca Acevedo<sup>1</sup>, Vicente Arriaga<sup>1</sup>, Katja Dohm<sup>3</sup>, Constantin Eiteneuer<sup>2</sup>, Sven Fahrner<sup>2</sup>, Frank Fischer<sup>4</sup>, Asis Hallab<sup>2</sup>, Alicia Mastretta-Yanes<sup>1</sup>, Roland Pieruschka<sup>2</sup>, Alejandro Ponce<sup>1</sup>, Yaxal Ponce<sup>2</sup>, Francisco Ramírez<sup>1</sup>, Irene Ramos<sup>1</sup>, Bernardo Terroba<sup>1</sup>, Tim Rehberg<sup>3</sup>, Verónica Suaste<sup>1</sup>, Björn Usadel<sup>2</sup>, David Velasco<sup>2</sup>, Thomas Voecking<sup>3</sup>, Dan Wang<sup>2</sup>

#### Author affiliations
1. CONABIO - Comisión Nacional para el Conocimiento y Uso de la Biodiversidad, México
2. Forschungszentrum Jülich - Germany
3. auticon - www.auticon.com
4. InterTech - www.intertech.de

### Zendro author contributions
Asis Hallab and Alicia Mastretta-Yanes coordinated the project. Asis Hallab designed the software. Programming of code generators, the browser based single page application interface, and the GraphQL application programming interface was done by Katja Dohm, Constantin Eiteneuer, Francisco Ramírez, Tim Rehberg, Veronica Suaste, David Velasco, Thomas Voecking, and Dan Wang. Counselling and use case definitions were contributed by Francisca Acevedo, Vicente Arriaga, Frank Fischer, Roland Pieruschka, Alejandro Ponce, Irene Ramos, and Björn Usadel. User experience and application of Zendro on data management projects was carried out by Asis Hallab, Alicia Mastretta-Yanes, Yaxal Ponce, Irene Ramos, Verónica Suaste, and David Velasco. Logo design was made by Bernardo Terroba.
