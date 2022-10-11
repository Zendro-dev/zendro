module.exports.gqs_dev_keycloak = `
Setting up keycloak...
Keycloak realm zendro created
Keycloak client {"clientId":"zendro_graphql-server","publicClient":true,"directAccessGrantsEnabled":true,"standardFlowEnabled":false} created
Keycloak client {"clientId":"zendro_graphiql","redirectUris":["http://localhost:7000/*"],"attributes":{"post.logout.redirect.uris":"http://localhost:7000/*"},"publicClient":false} created
Keycloak client {"clientId":"zendro_spa","redirectUris":["http://localhost:8080/*"],"attributes":{"post.logout.redirect.uris":"http://localhost:8080/*"},"publicClient":false} created
Keycloak default realm roles created
Keycloak default client roles for client zendro_graphql-server created
Keycloak default roles associated to client zendro_graphql-server
Keycloak realm management roles associated to realm-administrator
Keycloak default user created
`;

module.exports.gqs_dev_initialization = `
loaded model: city.js
loaded model: country.js
loaded model: river.js
strict mode: missing type "object" for keyword "properties" at "#" (strictTypes)
Server started without Authorization-Check. Start with command line argument 'acl', if Rule Based Authorization is wanted.
Merging Schema
initialize storage handlers for models
assign storage handler to sql models
assign storage handler to model: city
assign storage handler to model: country
assign storage handler to model: river
create associations among sql models
initialize storage handlers for adapters
App listening on port 3000
`;

module.exports.giql_dev = `
\$ next dev -p \${PORT:-7000}
ready - started server on 0.0.0.0:7000, url: http://localhost:7000
`;

module.exports.giql_prod = `
\$ next start -p \${PORT:-7000}
ready - started server on 0.0.0.0:7000, url: http://localhost:7000
`;

module.exports.spa_dev = `
\$ next dev -p \${PORT:-8080}
ready - started server on 0.0.0.0:8080, url: http://localhost:8080
`;

module.exports.spa_prod = `
\$ next start -p \${PORT:-8080}
ready - started server on 0.0.0.0:8080, url: http://localhost:8080`;
