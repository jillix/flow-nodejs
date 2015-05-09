engine
======

Engine is a framework/platform, which takes care of **resource loading**, **networking** and **interaction**.
Applications are made of module instances, which are configured in **composition** files.

### Install the server
1. Clone the repository: `git clone git@github.com:jillix/engine.git`
2. Go to the engine dir `cd engine` and do a `npm install`
3. If you like to run `engine` globally, run `npm link` in the engine directory.

### Install an app
1. Clone the repository: `git clone [git_url]`
2. Change directory: `cd [app_repo_dir]/` and do a `npm install`

### Start an app

```sh
$ engine [absolute/path/to/app/repo] [port]
```
#### Module guidlines
* A module has a isolated purpose and functionality.
* `flow` and `extFlow` handle the interactions (Events, DOM).
* Modules are independent and configurable.

Think of a module as a collection of functionality (`exports`) that can be used with the flow composition.

- **API**
    * Define a clear purpose and functionality.
    * Define the methods to export (accessible through flow).
    * Write flow `out` configuration examples (with all possible options).
    * Write methods with [jsDocs](https://github.com/jsdoc3/jsdoc) comments.

- **Config**
    * Define configurable options.
    * Write full configuration example.

- **NPM Package**
    * Use always versions for dependencies.
    * No promts in npm scripts.

#### Module package extensions
Extend the `npm` `package.json` with following info, to load module client resources:

```json
{
    "public": "public/folder",
    "clientDependencies": ["moduleName"],
    "components": {
        "scripts": ["file.js"],
        "styles": ["file.css"],
        "markup": ["file.html"]
    }
}
```

#### Composition

 - Module instance:

  ```json
  {
      "name": "string",
      "module": "string",
      "roles": {"roleName": true},
      "flow": [{}],
      "config": {},
      "client": {
          "config": {},
          "flow": [{}],
          "extFlow": [{}],
          "load": ["moduleInstanceName"],
          "styles": ["/path/file.css"],
          "markup": ["/path/file.html"]
      }
  }
  ```

 - Flow `in`:

  ```json
  {
      "in": "event_pattern",
      "1": false,
      "noRoute": false,
      "out": [{}]
  }
  ```

 - extFlow `in` (A module is responsible to handle an `extFlow` config.This example is form [adioo/view](https://github.com/adioo/view)):

  ```json
  {
      "in": "DOM_event",
      "selector": "#",
      "scope": "global|parent",
      "dontPrevent": false,
      "out": [{}]
  }
  ```

 - Flow `out`:

  ```json
  {
      "load": ["name"],
      "route": "path{value}",
      "emit": "event",
      "call": "method",
      "to": "instance",
      "data": {},
      "set": {
          "key": "path{value}",
          "key": "$#css:attr{value}"
      }
  }
  ```

#### Event handler types
 - link: `function (link) {}`
 - event: `function (event, data) {}`

#### Emit events
Engine events always have an event object as first parameter. So if a module emit event s from code, it's good to give an event object as first parameter.

```js
this.emit("eventName", {/*custom event*/}, {data: "object"});
```

#### Please note
* Websocket communication after restart ([Issue #174](https://github.com/jillix/engine/issues/174))
