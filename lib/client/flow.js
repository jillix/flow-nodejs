/**
     * Replace data fields in a string.
     *
     * @private
     * @param {string} The string.
     * @param {object} The data context.
     */
    function parsePath (path, event) {
        var self = this;
        var match = path.match(find_tmpl);

        // replace route with data
        if (match) {
            for (var i = 0, value; i < match.length; ++i) {

                // get value from object
                value = self._path(match[i].replace(find_braces, ''), event);

                // replace value in route
                if (typeof value !== 'undefined') {
                    path = path.replace(match[i], value);
                }
            }
        }

        return path;
    }

    /**
     * Parse a state search string to JSON.
     * Credentials: http://snipplr.com/view/70905/search-string-to-json/
     *
     * @private
     */
    function searchToJSON(){
        var rep = {'?':'{"','=':'":"','&':'","'};
        var s = state.search.replace(/[\?\=\&]/g, function(r) {
            return rep[r];
        });
        return JSON.parse(s.length? s+'"}' : "{}");
    }

/*


    // init constructors from top to bottom
    function initConstructors (err, constructors) {

        var length = constructors.length;
        var count = 0;
        var emitReady = [];
        var initConstructorsHandler = function (init) {

            if (!init) {

                // handle ready state
                for (var i = 0; i < emitReady.length; ++i) {

                    // mark element as ready
                    emitReady[i]._ready = true;
                    emitReady[i].emit('ready');
                }

                // emit empty route
                Z.route();

                return;
            }

            // set up ovserve configs from views and modules
            if (!init[0]) {
                flow.call(init[1], init[2], true);
                return initConstructorsHandler(constructors[++count]);
            }

            // call constructor
            init[0].call(init[1], init[2] || {}, function instanceConstructorCallback (err) {

                // get instances to emit ready event after all resources are loaded
                emitReady.push(init[1]);

                // continue initialization
                initConstructorsHandler(constructors[++count]);
            });
        };

        initConstructorsHandler(constructors[count]);
    }

    // load resources in parallel
    // TODO handle loading errors
    function loader (factory, clone, config, callback, sub, viewIndex) {
        var self = this;
        var elements = 1;
        var count = 0;
        var inits = [];
        var loaderHandler = function (err, constructor, _inits) {

            // catch constructor
            if (constructor) {
                inits.unshift([constructor, clone, config.config]);
            }

            inits = inits.concat(_inits || []);

            // init or callback when all elements are ready
            if (elements === ++count) {

                // add observe events config to initialization
                if (config.flow) {
                    inits.push([null, self, config.flow]);
                }

                // pass constructors to parent
                if (sub) {
                    callback(err, null, inits);

                // init constructors
                } else if (inits.length) {
                    initConstructors(err, inits);

                // finish without constructors
                } else {
                    callback(err, clone);
                }
            }
        };

        // factory clone
        factory && factory.call(self, clone, config, viewIndex - 1);

        // skip resources
        if (!config.load && !config.scripts) {
            return loaderHandler();
        }

        // load elements
        if (config.load) {

            // update the view index
            self._vi = self._vi || 0;

            // add the number of sub elements to count
            elements += config.load.length;

            // load sub elements
            for (var i = 0, type; i < config.load.length; ++i) {
                type = config.load[i][0];

                // increment view render order index
                if (type == 'V') {
                    ++self._vi;
                }

                // call loader
                self._load(type, config.load[i][1], loaderHandler, config.module ? true : false, self._vi);
            }
        }

        // load scripts
        if (config.scripts) {
            loadJS(config.module, config.main || 0, config.scripts, loaderHandler);
        }
    }

    // set up event flow
    function flow (config, onlyObs, onlyDom, domScope, data) {
        var self = this;
        var i, e, s;
        var elms;
        var flow;
        var scope = [domScope];

        // set children as scope if there is more then one data item
        if (domScope && data.length > 1 && domScope.children) {
            scope = domScope.children;
        }

        for (i = 0; i < config.length; ++i) {
            flow = config[i];

            // handle dom event
            if (flow.selector && !onlyObs) {

                // overwrite scope with the document
                if (flow.scope == 'global') {
                    scope = [doc];
                }

                // overwrite scope with parent
                if (flow.scope == 'parent') {
                    scope = [domScope];
                }

                for (s = 0; s < scope.length; ++s) {
                    elms = flow.selector === '.' ? [scope[s]] : scope[s].querySelectorAll(flow.selector);
                    if (elms) {
                        for (e = 0; e < elms.length; ++e) {

                            elms[e].addEventListener(
                                flow['in'],
                                createHandler.call(
                                    self,
                                    flow.out,
                                    scope[s],
                                    data[s],
                                    elms,
                                    flow.dontPrevent
                                )
                            );
                        }
                    }
                }

            // handle osberver event
            } else if (!onlyDom) {

                self.on(
                    flow['in'],
                    createHandler.call(self, flow.out),
                    flow['1'],
                    flow.noRoute
                );
            }
        }
    }

    // createHandler
    function createHandler (outConfig, domScope, dataItem, elms, dontPrevent) {
        var self = this;
        var i;

        return function handler (event, _data) {
            var config;
            var key;
            var to;
            var _path;
            var _domElm;
            var i;
            var loadElms = [];
            var path;
            var data;

            // create an event object
            event = event || {};
            event.ori = event.ori || self._name;

            // extend dom event object
            if (domScope) {

                // add dom scope to event
                event._scope = event._scope || domScope;

                // dont prevent default browser actions
                if (!dontPrevent) {
                    event.preventDefault();
                }

                // add found elements to event
                event._elms = elms;

                // add index of found elements
                event._item = event._item || dataItem;
            }

            // add pathname to data object
            event._path = win_location.pathname.substr(1).split('/');

            // parse and append url search to data
            if (win_location.search && !event._search) {
                event._search = searchToJSON();
            }

            // append url hash to data
            if (win_location.hash && !event._hash) {
                event._hash = win_location.hash.substr(1);
            }

            for (i = 0; i < outConfig.length; ++i) {

                config = outConfig[i];
                to = null;

                // check if target instance exists and set new scope
                if (config.to && !(to = cache.I[config.to])) {
                    continue;
                }

                // update scope
                var eSelf = to || self;

                // copy the static data or create a new data object
                data = config.data ? JSON.parse(JSON.stringify(config.data)) : {};

                // merge argument data to data object
                if (_data) {
                    for (key in _data) {
                        data[key] = _data[key];
                    }
                }

                // add dynamic data to the data object
                if (config.set) {

                    // add data to the data object
                    for (key in config.set) {

                        // parse path
                        path = parsePath.call(self, config.set[key], event);

                        // get an attribute value from a dom element or the element itself
                        if (path[0] === '$') {
                            _domElm = path.substr(1).split(':');

                            // TODO global scope should also be an option
                            _domElm[0] = doc.querySelector(_domElm[0]);

                            // get an attribute
                            if (_domElm[1]) {
                                _domElm[1] = _domElm[0][_domElm[1]];
                            }

                            // add dom attribute value or the element itself
                            data[key] = _domElm[1] === undefined ? _domElm[0] : _domElm[1];

                        // get search value with a path: 1. events, 2. data, 3. instance, 4. window
                        } else {
                            data[key] = self._path(path, event, true) || self._path(path, data, true) || self._path(path);
                        }
                    }

                    // create deep object out of flat keys
                    data = self._deep(data);
                }

                // collect elements to load
                if (config.load) {
                    loadElms.push(config.load);
                }

                // adapt to method
                if (config.route) {
                    eSelf.route(parsePath.call(self, config.route, data), data);
                }

                // emit an event
                if (config.emit) {
                    eSelf.emit.call(eSelf, config.emit, event, data);
                }

                // call a method
                if (config.call) {

                    // find call method when the event handler is called
                    if (typeof config.call === 'string' && typeof (config.call = eSelf._path(config.call)) !== fn) {
                        return console.error(self._name + ':', 'Cannot call', eSelf._name + ':' + config.call);
                    }

                    // call method
                    config.call.call(eSelf, event, data);
                }
            }

            // load elements in parallel
            loadElms[0] && loader.call(self, null, self, {load: loadElms}, function () {});
        };
    }
*/