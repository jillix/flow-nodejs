this.port = 80;

this.dev = true;

this.devPort = 8000;

this.root = __dirname;

this.operationKey = "@";

this.uploadDir = __dirname + "/files/upload";

this.orientDB = {
    
    //create: true,
    host:     "localhost",
    port:     2480,
    name:     "mono",
    username: "admin",
    password: "admin"
};

this.mongoDB = {
    
    name: "mono",
    host: "localhost",
    port: 27017
};

this.forever = {
    
    maxAttempts:   23,
    minUptime:     2000,
    spinSleepTime: 1000,
    mail:          "admin@jillix.com"
};
