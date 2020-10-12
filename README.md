# Zendro Command Line Interface (CLI)
## Introduction
A CLI for ScienceDbStarterPack.

## Commands
### zendro new <your_application_name>
Start a new application:
1. download starter pack to folder <your_application_name>
2. set up
3. copy seeders to graphql-server
4. **-d** or **--dockerize**: keep Dockerfiles (default: false). Set to be true, keep Dockerfiles. Default: remove Dockerfiles and initUserDb.sh
5. **-u** or **--update_code_generators**: update code generators (default: false). Set to be true, use npm to update code generators
6. a welcome interface
7. hints: edit config files if necessary
* ./graphql-server/config/data_models_storage_config.json 
* ./graphql-server/config/globals.js
* ./single-page-app/src/config/globals.js
* ./graphiql-auth/src/config/globals.js

### zendro generate-gqs
Generate code for graphql-server.
1. **-d** or **--data_model_definitions**: input directory or a JSON file
2. **-o** or **--output_dir**: output directory
3. **-m** or **--migrations**: generate migrations (default: false). Set to be true, generate migrations

### zendro generate-spa
Generate code for single-page-app.
1. **-d** or **--data_model_definitions**: input directory or a JSON file
2. **-o** or **--output_dir**: output directory
3. **-D** or **--createBaseDirs**: create base directories (default: false). Set to be true, create directories

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
3. **-i** or **--install_package**: install packages at the first time (default:false). Set to be true, install packages.

### zendro stop [service…]
Stop Zendro service.
1. default: stop all service
2. stop specified service with abbreviations

## Running Examples
1. create a new application (**test**). Keep docker files (**-d**) and update the latest stable code generators (**-u**) by executing  __zendro new -d -u test__. If you want to modify some environment variables, please edit relevant files, which are also specified in the console.
* ./graphql-server/config/data_models_storage_config.json 
* ./graphql-server/config/globals.js
* ./single-page-app/src/config/globals.js
* ./graphiql-auth/src/config/globals.js
  
2. __cd test__

3. generate graphql-server code and migrations by executing __zendro generate-gqs -d ../schema -m__.

4. generate single-page-app code by executing __zendro generate-spa -d ../schema__

5. install all necessary packages for all service and start all service by executing **zendro start -i**. Default database would be a local Postgres database. Its configuration is in this file: *./graphql-server/config/data_models_storage_config.json*.
   
6. stop all running service by executing **zendro stop**.

7. If you don't have local database, you can play with Zendro by dockerizing example Zendro App. The command would be **zendro dockerize -u**.

8. When you want to stop docker service, press CTRL+C once, then execute **zendro dockerize -d**.