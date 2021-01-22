# Zendro Command Line Interface (CLI)
## Introduction
A CLI for ScienceDbStarterPack.

## Commands
### zendro new <your_application_name>
Start a new application:
1. copy starter pack to folder <your_application_name>
2. clone single-page-app/graphql-server/graphiql-auth repositories from GitHub (version: see zendro_dependencies.json)
3. install packages for each repository
4. copy seeders to graphql-server
5. **-d** or **--dockerize**: keep Dockerfiles (default: false). Set to be true, keep Dockerfiles. Default: remove Dockerfiles and initUserDb.sh
6. a welcome interface
7. hints: edit config files if necessary
* ./graphql-server/config/data_models_storage_config.json 
* ./graphql-server/config/globals.js
* ./single-page-app/src/config/globals.js
* ./graphiql-auth/src/config/globals.js

### zendro generate-gqs
Generate code for graphql-server.
1. **-f** or **--data_model_definitions**: input directory or a JSON file
2. **-o** or **--output_dir**: output directory
3. **-m** or **--migrations**: generate migrations (default: false). Set to be true, generate migrations
4. allow unknown options

### zendro generate-spa
Generate code for single-page-app.
1. **-f** or **--data_model_definitions**: input directory or a JSON file
2. **-o** or **--output_dir**: output directory
3. **-D** or **--createBaseDirs**: create base directories (default: false). Set to be true, create directories
4. allow unknown options

### zendro dockerize 
Dockerize Zendro App with example docker files.
1. **-u** or **--up**: start docker service
* set the host of Postgres as sdb_postgres
* execute `docker-compose up`
2. **-d** or **--down**: stop docker service
* execute `docker-compose down`

### zendro start [service...]
Start Zendro service.
1. default: start all service
2. start specified service with the following abbreviations:
* gqs: graphql-server
* spa: single-page-app
* giql:graphiql

### zendro stop [service…]
Stop Zendro service.
1. default: stop all service
2. stop specified service with abbreviations

## Running Examples
1. create a new application (**test**). Keep docker files (**-d**) by executing  __zendro new -d test__. If you want to modify some environment variables, please edit relevant files, which are also specified in the console.
* ./graphql-server/config/data_models_storage_config.json 
* ./graphql-server/config/globals.js
* ./single-page-app/src/config/globals.js
* ./graphiql-auth/src/config/globals.js
  
2. __cd test__

3. generate graphql-server code and migrations by executing __zendro generate-gqs -f ../schema -m__

4. generate single-page-app code by executing __zendro generate-spa -f ../schema__

5. install all necessary packages for all service and start all service by executing **zendro start**. Default database would be a local Postgres database. Its configuration is in this file: *./graphql-server/config/data_models_storage_config.json*.
   
6. stop all running service by executing **zendro stop**.

7. If you don't have local database, you can play with Zendro by dockerizing example Zendro App. The command would be **zendro dockerize -u**.

8. When you want to stop docker service, press CTRL+C once, then execute **zendro dockerize -d**.
