var env = process.env;

var clone = require(env.Z_PATH_UTILS + 'object').clone;
var cache = require(env.Z_PATH_CACHE + 'cache');

// create instance cache with role check
var instanceCache = cache.pojo('instances', true);

module.exports = connectionHandler;

// check if role has access to instance and operation
function checkOperationAccess (role, instance, event) {

    // get instance with role check
    instance = instanceCache.get(instance, role);

    // check if this instance has acces to the requested operation
    if (instance && instance._access[event]) {
        return instance;
    }

    return;
}

function connectionHandler (err, session, websocket) {

    if (err) {
        return //wsError(ws, err);
    }

    // listen to messages
    websocket.on('message', function (message) {

        // parse message
        // protocoll: [type, instance, event, id, err data]
        try {
            message = JSON.parse(message.data);
        } catch (error) {
            return //wsError(ws, err);
        }

        // get role from session
        var role = session[env.Z_SESSION_ROLE_KEY];

        // event name
        var event = message[2];

        // get instance, if the role has access to the event
        var instance = checkOperationAccess(role, message[1], event);

        // ignore if instance doesn't exists
        if (!instance) {
            return //wsError(ws, new Error('Instance "' + message[1] + '"or event "' + event + '" not found'));
        }

        // get the link object
        var id = message[3];
        var link = instance._links[id];

        // data and error
        var data = message[5];
        var err = message[4];

        // create link and emit link event
        if (!link) {

            // create a new link with a custom id
            link = instance.link(event, null, id);
            link.socket = websocket;
            link.session = session;

            // save session in event
            link[env.Z_SESSION_ROLE_KEY] = role;
            link[env.Z_SESSION_USER_KEY] = session[env.Z_SESSION_USER_KEY];
            link[env.Z_SESSION_LOCALE_KEY] = session[env.Z_SESSION_LOCALE_KEY];

            // emit the new crated link
            instance.emit(event, link);
        }

        // handle message types
        switch (message[0]) {

            // END
            case 0:

                // call the end handler
                link._end(err, data);

                // destroy link
                delete instance.links[id];

                break;

            // DATA
            case 1:

                // call data handlers
                if (link._h.length) {
                    for (var i = 0; i < link._h.length; ++i) {
                        link._h.call(link._, err, data);
                    }
                }
        }


        // check if instance and event exists
        if (instance) {

            // emit event
            instance.emit(event.name, event, data[1], function (err, data) {

                // TODO implement loging
                if (err) {
                    console.log(instance._name, 'event:', event.name, 'error:', err);
                }

                event.send(err, data);
            });

        } else {
            //wsError(ws, new Error('Instance or event not found'), data[0][2]);
        }
    });
}

/*
// broadcast message to all connected sockets
function broadcast (event, err, data) {
    var self = this;

    data = createMessage(self._._name, event, err, data);

    // broadcast
    for (var i = 0, l = WS.clients.length; i < l; ++i) {
        WS.clients[i].send(data);
    }
}

// send server websocket errors
function wsError (ws, err, msgId) {
    ws.send(createMessage(env.Z_CORE_INST, 'error', err, null, msgId));
}
*/

/**
 * Send and recive data with the Link class.
 *
 * @class Link
 */
var Link = {

    /**
     * Send a data message over the link.
     *
     * @public
     * @param {object} The error data.
     * @param {object} The data object.
     */
    send: function (err, data) {

        // send message
        send.call(this, 1, err, data);
    },

    /**
     * Add a data handler, to receive data.
     *
     * @public
     * @param {function} The data handler method.
     */
    data: function (handler) {
        this._h.push(handler);
    },

    /**
     * Destroy the link with an error or data.
     *
     * @public
     * @param {object} The error data.
     * @param {object} The data object.
     */
    end: function (err, data) {

        // send message
        send.call(this, 0, err, data);

        // call the end handler
        this._end(err, data);

        // destroy link
        delete this._.links[this.id];
    }
};

/**
 * Create and send a websocket message.send
 *
 * @private
 * @param {number} The message type.
 * @param {object} The error object.
 * @param {object} The data object.
 */
function send (type, err, data) {

    // create message
    var message = [type, this._._name || 0, this.event, this.id, err ? err.toString() : 0];

    // add the data to the message
    if (data) {
        message[5] = data;
    }

    // encode message (string)
    try {
        message = JSON.stringify(message);

    // return error
    } catch (err) {
        return err;
    }

    // send message
    this.socket.send(message, function(error) {
        // sometimes a socket is closed before the operation is complete.
        // those errors can be ignored
    });
}

/**
 * Create a connected link.
 *
 * @public
 * @param {object} The link configuration.
 * @param {function} The connection end handler.
 * @param {string} Optional custom link id.
 */
function createLink (event, callOnEnd, id) {

    // create link object
    var link = engine.clone(Link);

    // add instance to link
    link._ = this;

    // data handlers
    link._h = [],

    // creae a unique link id
    link.id = id || engine.uid(3);

    // attach end callback
    link._end = callOnEnd || function () {};

    // save link event
    link.event = event;

    // save in the module instances link cache
    this._links[link.id] = link;

    // return link object
    return link;
}