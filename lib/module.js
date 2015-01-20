var env = process.env;
var EventEmitter = require('events').EventEmitter;
var fingerprint = require('./fingerprint');

//var broadcast = require(env.Z_PATH_SERVER + 'send').broadcast;
//var model = require(env.Z_PATH_MODELS + 'factory');
//var view = require(env.Z_PATH_VIEWS + 'factory');
var cache = require('./cache');

// init caches
var compInstances = cache.comp('instances');
var compModules = cache.comp('modules');
var fileModule = cache.file('module', {wd: env.Z_PATH_PROCESS_MODULES});
var fileClient = cache.file('client', {wd: env.Z_PATH_CLIENT, noWrap: true});

// init the core module
var instance = new EventEmitter();

instance._module = 'core',
instance._name = env.Z_CORE_INST,
instance._access = {},

// set public rights to core module
instance._roles = {'*': true};

// set core module access
instance._access[env.Z_SEND_INST_REQ] = true;
instance._access[env.Z_SEND_MODULE_REQ] = true;
instance._access[env.Z_SEND_CLIENT_REQ] = true;

// setup client event interface
instance.on(env.Z_SEND_INST_REQ, function (event, data, callback) {
    var self = this;
    load.call(self, event, data, callback);
});
instance.on(env.Z_SEND_MODULE_REQ, moduleFiles);
instance.on(env.Z_SEND_CLIENT_REQ, client);

// attach the broadcast functionality
//instance._broadcast = broadcast;

// init mono module and save in cache
compInstances.pojo.set(instance._name, instance);

function linkHandler (link) {
    var self = this;

    // listen to event
    self[link['1'] ? 'once' : 'on'](link.event, function (event, data, callback) {
        self = this;

        // emit or call on a different instance
        // TODO check role access!
        if (link.to) {
            self = compInstances.pojo.get(link.to, event.session.role);
            if (!self) {
                return;
            }
        }

        // create an empty data object
        if (!data && (link.data || link.set)) {
            data = {};
        }

        // handle static data
        if (link.data) {

            // create copy
            try {
                var copy = JSON.parse(JSON.stringify(link.data));

                // merge static data in data
                for (var key in copy) {
                    data[key] = copy[key];
                }
            } catch (err) {

                // websocket requests
                if (event.ws) {
                    return callback(err);
                }

                // http requests
                return callback(500, err);
            }
        }

        // add dynamic data to the data object
        if (link.set) {
            for (var prop in link.set) {
                data[prop] = engine.path(link.set[prop], self);
            }
        }

        // handle method call
        if (link.call) {

            if (typeof link.call === 'string') {
                link.call = engine.path(link.call, self) || link.call;
            }

            if (typeof link.call !== 'function') {

                var err = new Error('links: Cannot find module method: ' + link.call);

                // websocket requests
                if (event.ws) {
                    return event.send(err);
                }

                // http requests
                return event.send(500, err);
            }

            // call linked method
            link.call.call(self, event, data, callback);
        }

        // emit event
        if (link.emit) {
            self.emit(link.emit, event, data, callback);
        }
    });

    // ensure clinet send array
    if (!self._client.send) {
        self._client.send = [];
    }

    // add send events to client
    self._client.send.push(link.event);
    self._access[link.event] = true;
}

// set up link configuration
function linkSetup (instance, links, callback) {

    // set up links
    for (var i = 0, link; i < links.length; ++i) {
        linkHandler.call(instance, links[i]);
    }

    callback(null, instance._client);
}

// create instance
function instanceFactory (name, module, compInst, callback) {

    // create new Mono observer instance
    var instance = new EventEmitter();
    instance._module = module.name ? module.name.replace(/_/g, '/') + '/' : 'c';
    instance._name = compInst.name;
    instance._access = {};
    instance._roles = compInst.roles || {};
    instance._client = {};

    // save configs on instance
    if (compInst.config) {

        // save custom client config
        if (compInst.config.client) {
            instance._client = {
                config: compInst.config.client
            };
        }

        // server config
        instance._config = compInst.config.server || {};
    }

    // save observe infos in client
    if (compInst.flow) {
        instance._client.flow = compInst.flow;
    }

    // save module name in client config
    instance._client.module = instance._module;

    // merge scripts
    // all dependencies of the instance dependencies must be in this array!
    // while installing a module, save all dependencies in the module deps
    // dependencies: ['./file.js', 's/o/modA/v']
    // => ModA deps: ['./file.js', 's/o/modB/v'] => ModB deps: []
    // => to client: ['./file.js', 's/o/n/v/file.js']

    // append module depedency scripts
    if (module.dependencies) {
        instance._client.scripts = module.dependencies.concat(compInst.scripts || []);

    // append instance scripts
    } else if (compInst.scripts) {
        instance._client.scripts = compInst.scripts;
    }

    // TODO better do callback buffering on instances, then copy the scripts
    instance._scripts = instance._client.scripts ? instance._client.scripts.slice() : [];

    // save load infos in client
    if (compInst.load) {
        instance._client.load = compInst.load;
    }

    // attach create link hander method to instance
    instance._link = linkHandler;

    // add model factory to instance and setup model events
    instance.model = model.factory;
    instance._link({event: env.Z_SEND_MODEL_REQ, call: model.service});
    instance._link({event: env.Z_SEND_QUERY_REQ, call: model.queries});

    // setup view service
    instance._link({event: env.Z_SEND_VIEW_REQ, call: view});

    // handle send configurations
    if (!compInst.links) {
        compInst.links = [];
    }

    // set up core send events
    compInst.links.push({event: env.Z_SEND_INST_REQ, call: load});

    // attach the broadcast functionality
    //instance._broadcast = broadcast;

    // add fingerprints to scripts
    fingerprint.addToFiles(instance._module, instance._scripts, function (err, scripts) {

        if (err) {
            return callback(err);
        }

        // update scripts
        instance._client.scripts = scripts;

        // send original instance name to client, in case it's an alias
        if (compInst.name !== name) {
            instance._client.name = compInst.name;

            // save instance also under original name
            compInstances.pojo.set(compInst.name, instance);
        }

        // configure client main file
        if (module.clientMain) {
            instance._client.main = module.clientMain;
        }

        // save instance in cache
        compInstances.pojo.set(name, instance);

        // require and init module
        if (module.main) {

            try {

                // get absolute path from the repo and relative path from the module
                var path = module.main[0] === '/' ? env.Z_PATH_PROCESS_REPO : env.Z_PATH_PROCESS_MODULES + instance._module;
                var monoModule = require(path + module.main);

                if (typeof monoModule === 'function') {
                    monoModule.call(instance, instance._config || {}, function (err) {

                        if (err) {

                            // remove instance from cache
                            compInstances.pojo.rm(name);

                            return callback(err);
                        }

                        // setup links
                        if (compInst.links) {
                            return linkSetup(instance, compInst.links, callback);
                        }

                        callback(null, instance._client);
                    });
                }
            } catch (err) {

                // remove instance from cache
                compInstances.pojo.rm(name);

                callback('Module ' + compInst.name + ' init error: ' + err.toString());
            }
        } else {

            // setup links
            if (compInst.links) {
                return linkSetup(instance, compInst.links, callback);
            }

            callback(null, instance._client);
        }
    }, true);
}

// init module with newly created module instance as this
function loadinstance (name, role, callback) {

    // get and set model config from composition store
    compInstances.get(name, role, function (err, instance, instanceChanged) {

        if (err) {
            return callback(err);
        }

        // check access
        if (!instance) {
            return callback(new Error('Instance ' + name + ' not found.'));
        }

        // don't get a module if the instance is a custom module
        if (typeof instance.module === 'object') {
            return instanceFactory(name, instance.module, instance, callback);
        }

        compModules.get(instance.module, role, function (err, module) {

            if (err) {
                return callback(err);
            }

            // check access
            if (!module) {
                return callback(new Error('Module ' + instance.module + ' not found.'));
            }

            // remove instance on module change
            if (!instanceChanged) {
                compModules.obs.once('change:' + instance.module, function () {
                    compInstances.rm(name, role);
                });
            }

            instanceFactory(name, module, instance, callback);
        });
    });
}

// load instance configuration (ws)
function load (event, instance, callback) {
    var self = this;

    // create start instance with hostname
    if (instance === '_') {

        instance = event.ws.upgradeReq.headers.host.split(':')[0].replace(/\./g, '_');

        // get the public version of the start instance
        if (!event.role) {
            instance += '.pub';
        }
    }

    // send client config from cache
    var cachedInstance = compInstances.pojo.get(instance, event.role);

    // handle no access case
    if (cachedInstance === 0) {
        return callback('Instance: ' + instance + '. Error: Instance not found.');
    }

    if (cachedInstance) {
        return callback(null, cachedInstance._client);
    }

    // load and init module
    loadinstance(instance, event.role, function (err, client) {

        if (err) {
            return callback('Instance: ' + instance + ' Error: ' + err);
        }

        // return client config
        callback(null, client);
    });
}