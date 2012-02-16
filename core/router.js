var send = require(process.env.ROOT + "/core/send").send,
    Nscript	= process.env.DEV ? "N.dev.js" : "N.js",
    Rscript = process.env.DEV ? "require.dev.js" : "require.js",
    delimiter = "\/";

var table = {
    
    '/': 5,
    'users': {
        
        'public.*': 10,
        'admin': 454
    },
    'roles': 71
}

this.route = function(link) {
    
    var compID = traverse(link.req.url, table);
    
    if (compID) {
    
        //set headers
        link.res.headers['content-style-type'] = "text/css";
        link.res.headers['content-type']       = "text/html; charset=utf-8";
        
        send.ok(
           
           link.res,
           "<!DOCTYPE html><html><head>"+
           "<script data-main='/"+ CONFIG.operationKey +"/getModule/N/"+ Nscript +"' src='/"+ CONFIG.operationKey +"/getModule/"+ Rscript +"'></script>"+
           "<script type='text/javascript'>"+
               "N.ok='/"+ CONFIG.operationKey +"'"+
               "window.onload=function(){N.comp('body','"+ compID +"')}"+
           "</script>"+
           "</head><body></body></html>"
        );
    }
    else {
        
        send.notfound(link.res);
    }
}

/*
    borrowed logic from https://github.com/flatiron/director/blob/master/lib/director/router.js
    thanks!
*/

//
// ### function traverse (path, routes, regexp)
// #### @path {string} Path to find in the `routes` table.
// #### @routes {Object} Partial routing table to match against
// Core routing logic: traverses the
// specified `path` within `routes` looking for component-id 
// returning a component-id or false if nothing is found. 
//
function traverse(path, routes, regexp) {

    var current,
        match;
    
    //remove last backslash from path
    path = path != delimiter ? path.replace(/\/$/, "") : path;
    
    if (!regexp) {
        
        regexp = "";
    }
    
    //
    // Base Case #1: 
    // If we are dispatching from the root
    // then only check if the component-id exists.
    //
    if (path === delimiter && typeof routes[path] == "number") {
        
        return routes[path];
    }
    
    for (var r in routes) {
        
        //
        // We dont have an exact match, lets explore the tree
        // in a depth-first, recursive, in-order manner
        //
        if (routes.hasOwnProperty(r)) {
            
            //
            // Attempt to make an exact match for the current route
            // which is built from the `regexp` that has been built 
            // through recursive iteration.
            //
            current = regexp + delimiter + r;
            
            match = path.match(new RegExp('^' + current));
            
            if (!match) {
                //
                // If there isn't a `match` then continue. Here, the
                // `match` is a partial match. e.g.
                //
                //    '/foo/bar/buzz'.match(/^\/foo/)   // ['/foo']
                //    '/no-match/route'.match(/^\/foo/) // null
                //
                continue;
            }
            
            if (match[0] && match[0] == path) {
                //
                // ### Base case 2:
                // If we had a `match` and the capture is the path itself, 
                // then we have completed our recursion.
                //
                return routes[r];
            }
            
            //
            // ### Recursive case:
            // If we had a match, but it is not yet an exact match then
            // attempt to continue matching against the next portion of the
            // routing table. 
            //
            traverse(path, routes[r], current)
        }
    }
    
    return false;
};