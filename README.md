# Zendro Command Line Interface (CLI)
## Introduction
A CLI for building Zendro Sandox.

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
4. copy seeders to graphql-server and create templates of environment variables for each repository
5. **-d** or **--dockerize**: keep Dockerfiles (default: false). Set to be true, keep Dockerfiles. Default: remove Dockerfiles and initUserDb.sh
6. a welcome interface
7. hints: edit config files if necessary
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
2. Execute `zendro set-up -d <name>`, then the default configuration would be there.
3. Execute `zendro dockerize -u -p`, then zendro instance with production mode would start.
4. Execute `zendro dockerize -d -p -v`, then zendro instance would stop and all volumes would be removed.

## A Detailed Example for setting up a Zendro Instance
1. create a new application (**test**). Keep docker files (**-d**) by executing  __`zendro new -d test`__. If you want to modify some environment variables, please edit relevant files, which are also specified in the console.
* without docker setup: ./graphql-server/config/data_models_storage_config.json
* with docker setup: ./config/data_models_storage_config.json
* ./graphql-server/.env
* SPA in development mode: ./single-page-app/.env.development
* SPA in production mode: ./single-page-app/.env.production
* ./graphiql-auth/.env
  
2. __cd test__

3. add JSON files for model definitions in `./data_model_definitions` folder and generate graphql-server (GQS) code and migrations by executing __`zendro generate -m`__

4. if you prefer to use local setup with keycloak, you can start all service by executing **`zendro start`**. Default database would be a local Postgres database. Its configuration is in this file: `./graphql-server/config/data_models_storage_config.json`. If user would like to add other storage types, it is necessary to edit this file. Meanwhile, if you would like to use production mode, please add `-p` option.
   
5. stop all running service by executing **`zendro stop`**. Besides, if you would like to stop production mode, please add `-p` option.

6. If you don't have local setup with keycloak, you can play with Zendro by dockerizing example Zendro App. The command would be **`zendro dockerize -u`**. Moreover, if you would like to use production mode, please execute **`zendro dockerize -u -p`**. Besides, the default username is `zendro-admin` and the corresponding password is `admin`. 

7. When you want to stop docker service, press CTRL+C once, then execute **`zendro dockerize -d`**. In addition, if your services are in production mode, please execute **`zendro dockerize -d -p`**. 

## Example for Migrations
If a user has new data model definitions, it is convinient to use Zendro CLI for dealing with migrations. And the following procedure shows how to generate, perform or drop migrations:
1. in `graphql-server` folder, execute `zendro migration:generate -f <data_model_definitions>`. The migrations are automatically generated in the `/graphql-server/migrations` folder. By default, every migration file has two functions, namely `up` and `down`. The `up` function creates a table, the `down` function deletes the existing table. Furthermore it is possible to customize the migration functions.
2. in `graphql-server` folder, it is possible to perform new generated migrations, which are generated after the last executed migration, by executing `zendro migration:up`. After that, the last executed migration and migration log are updated.
3. in `graphql-server` folder, the last executed migration can be dropped by executing `zendro migration:down`. This will update the latest successful migration and add the dropped operation to the migration log. If there are some remaining records and associations in the table, by default an error is thrown. To forcefully drop the table, in spite of remaining records, set the environment variable `DOWN_MIGRATION` to `true` in `/graphql-server/.env` file and re-execute this down-migration.

## Uploading a File
### Data format requirements
Data to populate each model in your schema must be in a separate CSV file, following the format requirements below:
1. Column names in the first row must correspond to model attributes.
2. Empty values should be represented as `"NULL"`.
3. All fields should be quoted by `"`. However, if field delimiter and array delimiter do not occur in fields with String type, namely characters could be splitted without ambiguity, then each field could not be quoted. For example, if the field delimiter is comma, and one String field is like `Zendro, excellent!`. Without the quotation mark, this field would be splitted as two fields. So in such case these String fields must be quoted.
4. Default configuration: BATCH_SIZE=20, RECORD_DELIMITER="\n", FIELD_DELIMITER=",", ARRAY_DELIMITER=";". They can be changed in the config file for environment variables.
5. Date and time formats must follow the [RFC 3339](https://tools.ietf.org/html/rfc3339) standard.

### Examples
There are two ways to upload a file via zendro CLI:
1. If the Zendro instance is on your local machine, you can directly go into the folder `graphql-server` and execute
`zendro bulk-create -f <filename> -n <modelname> -s <sheetname>`, e.g. `zendro bulk-create -f ./country.csv -n country`. Three formats are supported here, namely CSV, XLSX and JSON. And the paramter `sheetname` is only used for XLSX file. If it is empty, by default records in the first sheet would be imported. And the default configuration for delimiters and batch size, you can find them in `graphql-server/.env`.
2. If you want to upload a file to a remote Zendro server, it is also possible via Zendro CLI. All configuration could be modified in the file `zendro/.env.migration`. After the configuration, you can execute `zendro bulk-create -f <filename> -n <modelname> -s <sheetname> -r`, e.g. `zendro bulk-create -f ./country.csv -n country -r`.

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
