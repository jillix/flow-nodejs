jillix Web Framework

Installation
========
```
npm install
```
This also installs the OrientDB server in the `bin` directory and the mono database form the `admin/scripts/orientdb` directory.

Start the mono server:
```
node lib/proxy/server.js
```

Start mono as deamon with forever: (the log is written to tmp/log.txt)
```
node start
```
