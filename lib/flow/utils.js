/**
 * Clone object. True prototypal inheritance.
 *
 * @public
 * @param {object} The, to be cloned, object.
 */
exports.clone = function (object) {

    // create an empty function
    function O() {}

    // set prototype to given object
    O.prototype = object;

    // create new instance of empty function
    return new O();
};

// client side process.nextTick hack
if (typeof window !== 'undefined') {

    var queue = [];

    window.addEventListener('message', function (event) {
        var source = event.source;

        if ((source === window || source === null) && event.data === '_E_nT') {
            event.stopPropagation();
            if (queue.length > 0) {
                var fn = queue.shift();
                fn();
            }
        }
    }, true);
}

exports.nextTick = function (fn) {

    var args = [].slice.apply(arguments);
    var closure = function () {
        fn.apply(this, args.slice(1));
    };

    if (global.process) {
        // TODO Remove this when NodeJS will support nextTick with arguments
        if (process.versions.node[0] > 0) {
            return process.nextTick.apply(this, args);
        } else {
            return process.nextTick(closure);
        }
    }

    // browser
    queue.push(closure);
    window.postMessage('_E_nT', '*');
};

/**
 * Get a value from a property "path" (dot.notation).
 * path('Object.key.key.value'[, {'key': {'key': {'value': 123}}}]);
 *
 * @public
 * @param {string} The path in "dot" notation.
 * @param {array} The data objects, which are used to search the path.
 */
exports.path = function getPathValue (path, scopes, count) {

    if (!path) {
        return;
    }

    // get scope
    count = count || 0;
    var scope = scopes[count];

    // if no scope is found
    if (!scope) {
        return;
    }

    // prepare path
    var o = path;
    path = path.split('.');

    // find keys in paths or return
    for (var i = 0; i < path.length; ++i) {
        if ((scope = scope[path[i]]) === undefined) {
            return scopes[++count] ? getPathValue(o, scopes, count) : undefined;
        }
    }

    return scope;
};

/**
 * Create a flat object {key1: {key2: "value"}} => {"key1.key2": "value"}
 *
 * @public
 * @param {string} The object, which is flattened.
 */
exports.flat = function (object) {
    var output = {};
    var value;
    var newKey;

    // recusrive handler
    function step(obj, prev) {
        for (var key in obj) {
            value = obj[key];
            newKey = prev + key;

            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {

                if (Object.keys(value).length) {
                    step(value, newKey + '.');
                    continue;
                }
            }

            output[newKey] = value;
        }
    }

    // start recursive loop
    step(object, '');

    return output;
};

/**
 * Unflatten dot-notation keys {"key1.key2": "value"} => {key1: {key2: "value"}}
 *
 * @public
 * @param {string} The object, which is unflattened.
 */
exports.deep = function (object) {
    var result = {};
    var parentObj = result;
    var key;
    var subkeys;
    var subkey;
    var last;
    var keys = Object.keys(object);

    for (var i = 0; i < keys.length; ++i) {

        key = keys[i];
        subkeys = key.split('.');
        last = subkeys.pop();

        for (var ii = 0; ii < subkeys.length; ++ii) {
            subkey = subkeys[ii];
            parentObj[subkey] = parentObj[subkey] === undefined ? ((subkeys[ii + 1] || last) === "0" ? [] : {}) : parentObj[subkey];
            parentObj = parentObj[subkey];
        }

        parentObj[last] = object[key];
        parentObj = result;
    }

    return result;
};


/**
 * Retruns a random string.
 *
 * @public
 * @param {number} The length of the random string.
 */
exports.uid = function (len) {
    len = len || 23;
    for (var i = 0, random = ''; i < len; ++i) {
        random += '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'[0 | Math.random() * 62];
    }
    return random;
};

/**
 * Check if role has access to instance and event.
 *
 * @public
 * @param {string} The role name.
 * @param {string} The module instance name.
 * @param {string} The event name.
 */
exports.eventAccess = function (item, role, event) {

    // check instance
    if (!item) {
        return;
    }

    // check role
    if (!this.roleAccess(item, role)) {
        return;
    }

    // check if this instance is alloed to emit the event
    if (!item._flow || !item._flow[event]) {
        return;
    }

    // access granted
    return true;
};

/**
 * Check the role access for a cache item.
 *
 * @public
 * @param {object} The cached item.
 * @param {string} The role name.
 */
exports.roleAccess = function (item, role) {

    var roles = item && (item._roles || item.roles || {}) || {};

    if (item === null || roles['*'] || roles[role]) {
        return true;
    }
};