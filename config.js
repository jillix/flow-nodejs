// use optimist to parse the command line options
var argv = require("optimist")
    .default("config", __dirname + "/mono.json")
    .argv;

// load the mono configuration file
var config = module.exports = require(argv.config);

if (argv.dev === true || config.dev === true) {
    console.log("Using configuration file: " + argv.config);
}

config.log = config.log || {};

function throwError(message) {
    throw new Error("ERROR: " + message);
}

// process command line parameters
for (var i in argv) {
    switch (i) {
        case "_":
        case "$0":
            continue;
        case "log":
            var splits = argv[i].toString().split(",");
            for (var j in splits) {
                config.log[splits[j].trim()] = true;
                //console.log("log." + splits[j] + "=true");
            }
            break;
        default:
            config[i] = true;
            //console.log(i + "=" + argv[i]);
    }
}

// configure the root directory
config.root = __dirname;

// configure defaults


// log level
//      One of: none, error, warning, info, debug, verbose
//
config.logLevel = argv.logLevel || config.logLevel;
if (!config.logLevel) {
    if (config.dev) {
        config.logLevel = "debug";
    }
    else {
        config.logLevel = "error";
    }
}
else {
    switch (config.logLevel) {
        case "none":
        case "error":
        case "warning":
        case "info":
        case "debug":
        case "verbose":
            break;
        default:
            throw new Error(config.logLevel + " is not a supported log level.");
    }
}


// admin Email
//      Email address to send problems to.
//      E.g.: if the server is restarted, etc.
//
if (config.adminEmail) {

    var filter = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
    
    if (!filter.test(config.adminEmail)) {
        throw new Error("ERROR: Notification set active, but no valid mail has been set!");
    }
}


// OrientDB connection
//
config.orient || throwError("The OrientDB configuration is missing");
config.orient.server || throwError("The OrientDB configuration is missing the server key");
config.orient.db || throwError("The OrientDB configuration is missing the db key");

