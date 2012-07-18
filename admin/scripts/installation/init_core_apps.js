// the mono configuration as global object
CONFIG = require(process.cwd() + "/config");

var cp = require('child_process');
var fs = require('fs');

var orient = require(CONFIG.root + "/core/db/orient.js");
var appsApi = require(CONFIG.root + "/api/apps");
var model = require(CONFIG.root + "/core/model/orient");

var apps = fs.readdirSync(CONFIG.root + "/apps");

var descriptorFiles = [];

for (var i in apps) {

    var appId = apps[i];
    var monoJson = CONFIG.root + "/apps/" + appId + "/mono.json";

    if (appId.length == 32 && fs.existsSync(monoJson)) {
        descriptorFiles.push(monoJson);
    }
}

// recursive function to serialize the application installation
function installApp(i) {
    if (i < descriptorFiles.length) {
//if (descriptorFiles[i].indexOf("5849564d3d426d7278683d283f3c5d37") == -1) return installApp(++i);

        console.log("-------------------");
        console.log("Installing application: " + descriptorFiles[i]);

        appsApi.install(descriptorFiles[i], function(err, appId) {

            if (err) {
                if (CONFIG.orient.DB) {
                    CONFIG.orient.DB.close();
                }
                console.error(err);
                console.error("Failed to install application: " + appId);
            } else {
                console.log("Succesfully installed application: " + appId);
            }

            // install the next application
            installApp(++i);
        });
    }
}

// start the installation of all apps
installApp(0);

