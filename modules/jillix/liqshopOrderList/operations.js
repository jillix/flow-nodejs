var model = require(CONFIG.root + "/core/model/orient"),
    send  = require(CONFIG.root + "/core/send.js").send,
    mongo = require(CONFIG.root + "/db/mongo").db;

var url = require("url"),
    qs  = require("querystring");


exports.getBranches = function(link) {

    mongo("sag", "branch", function(err, db) {

        if (err) {
            send.internalservererror(link, err);
            return;
        }

        // all users
        if (link.path.length == 0) {

            db.find({ "companyName" : { $exists : true }}).toArray(function(err, docs) {

                if (err) {
                    send.internalservererror(link, err);
                    return;
                }

                send.ok(link.res, docs);
            });
        }
    });
};


exports.getOrders = function(link) {

    mongo("sag", "orders_new", function(err, db) {

        if (err) {
            send.internalservererror(link, err);
            return;
        }

        var urlObj = url.parse(link.req.url);
        var queryObj = qs.parse(urlObj.query);
 
        var mongoQuery = {
            "_s.n": "orders",
            "_l": "de_CH"
        }

        var archiveFilter = {
            "$elemMatch": {
                "archived": { $exists: 0 }
            }
        };

        // branch filtering
        var branch = queryObj.branch;
        if (branch !== "0") {
            archiveFilter["$elemMatch"].branch = branch;
        }

        // archive filtering
        var archive = queryObj.archive;
        if (archive === "1") {
            archiveFilter = {
                "$not": archiveFilter
            };
        }

        var mongoQuery = {
            "_s.n": "orders",
            "_l": "de_CH",
            "items": archiveFilter
        }

        //console.log(JSON.stringify(mongoQuery));

        db.find(mongoQuery).toArray(function(err, docs) {

            if (err) {
                send.internalservererror(link, err);
                return;
            }

            // all the orders contain item that match the filters (branch and archive)
            // we have to filter out now all the items that should not be visible by some branches

            var orders = [];

            for (var i in docs) {
                
                var order = docs[i];
                var items = [];

                for (var j in order.items) {

                    var item  = order.items[j];

                    if (branch === "0" || branch !== "0" && item.branch === branch) {
                        items.push(item);
                    }
                }

                // overwrite the initial items
                order.items = items;

                if (items.length) {
                    orders.push(order);
                }
            }

            send.ok(link.res, orders);
        });
    });
};


function dateToInt(date) {

    var day = "0" + date.getDate();
    var month = "0" + (date.getMonth() + 1);
    var year = date.getFullYear();

    return parseInt(year + month.substr(-2) + day.substr(-2));
}

