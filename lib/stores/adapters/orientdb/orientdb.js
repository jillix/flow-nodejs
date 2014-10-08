// Dependencies
var Orient = require('oriento');

// Cache objects
var servers = {};
var dbs = {};

module.exports = function (user, pass, config, callback) {

    config = Object(config);
    var cbck = function (err, data) {
        process.nextTick(function () {
            callback(err, data);
        });
    };

    // Check store cache
    // TODO Same host?
    if (dbs[config.database]) {
        return cbck(null, dbs[config.database]);
    }

    config.host = config.host || 'localhost';
    config.port = config.port || 2424;
    config.httpPort = config.httpPort || 2480;

    var serverPath = [config.host, config.port, config.httpPort].join(':');

    // Get client
    var server = servers[serverPath] || (servers[serverPath] = new Orient({
       host: config.host,
       port: config.port,
       httpPort: config.httpPort,
       username: 'guest',
       password: 'guest'
    }));

    // Get database
    dbs[config.database] = server.use({
        name: config.database,
        username: user,
        password: pass
    });

    cbck(null, dbs[config.database]);
};