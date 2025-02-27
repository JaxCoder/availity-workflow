# availity-workflow

> Toolkit for Availity web projects. Heavily inspired by create-react-app.

[![](https://img.shields.io/github/license/availity/availity-workflow.svg?style=for-the-badge)](https://github.com/Availity/availity-workflow)
[![](https://img.shields.io/npm/v/@availity/workflow.svg?style=for-the-badge&logo=npm)](https://www.npmjs.com/package/availity-workflow)

## Table of Contents

-   [Getting Started](#getting-started)
-   [Features](#features)
-   [CLI](#cli)
-   [Configuration](#configuration)
-   [Upgrading](#upgrading)
-   [FAQ](#faq)
-   [CONTRIBUTE](#contribute)
-   [DISCLAIMER](#disclaimer)
-   [License](#license)

## Getting Started

### React

```bash
npx @availity/workflow init <your-project-name>
```

<small>Note: `<your-project-name>` is the name of your project following the npm package naming standard</small>

### Angular

> ⚠️ Note we have dropped angular support, this is issuing a legacy version of workflow ⚠️

```bash
npx @availity/workflow init <your-project-name> --template https://github.com/Availity/availity-starter-angular
```

#### Availity Templates

-   [React Starter (default)](https://github.com/Availity/availity-starter-react)
-   [Wizard Starter (React)](https://github.com/Availity/availity-starter-wizard)
-   [TypeScript Starter (React)](https://github.com/Availity/availity-starter-typescript)

<small>Note: use `-t` or `--template` to specify a template</small>

## Features

-   Files placed in `project/app/static` will automatically get copied to the build directory. This can be useful when an application needs to reference static documents like images and PDFs without having to import them using Webpack. The files would be accessible through the path `static` relative to the application.
-   A global variable `APP_VERSION` is written to javascript bundle that can be used to determine the version of the application that was deployed. Open up the browser debugger and type `APP_VERSION`.
-   Hook into Jest `setupFiles` by adding `jest.setup.js` at the root of your project

## CLI

CLI options are documented in it's [README](./packages/workflow/README.md)

## Configuration

`workflow` can be configured using a javascript or yaml configuration file called `workflow.js` or `workflow.yml`.
`workflow.js` or `workflow.yml` lives in `<application_root>/project/config/workflow.js`

**Example:**

```js
module.exports = {
    development: {
        notification: true
        hotLoader: true
    },
    app: {
        title: 'My Awesome App'
    }
    mock: {
        latency: 300,
        port: 9999
    },
    proxies: [
        {
            context: '/api',
            target: `http://localhost:9999`,
            enabled: true,
            logLevel: 'info',
            pathRewrite: {
            '^/api': ''
            },
            headers: {
                RemoteUser: 'janedoe'
            }
        }
    ]
}
```

`workflow` can also be configured using `package.json`:

```js
{
    "name": "foo",
    "availityWorkflow": {
        development: {
            notification: true
            hot: true
        },
        "app": {
            "title": "My Awesome App"
        }
    }
}
```

If `workflow.js` exports a function it can be used to override properties from the default configuration. The function must return a configuration.

```js
function merge(config) {
    config.development.open = '#/foo';
    return config;
}

module.exports = merge;
```

or

```js
module.exports = (config) => {
    config.development.open = '/';
    config.development.hotLoader = true;

    return config;
};
```

### Options

#### `development.open`

Opens the url in the default browser

#### `development.notification`

Webpack build status system notifications

#### `development.host`

Webpack dev server host

#### `development.port`

Webpack dev server port. If the port at this value is unavailable, the port value will be incremented until an unused port is found.
Default: `3000`

#### `development.stats.level`

Allows [Webpack log levels presets](https://webpack.js.org/configuration/stats/#stats) to be used during development.

#### `development.infrastructureLogging.level`

Allows [Webpack infrastructure log levels](https://webpack.js.org/configuration/other-options/#infrastructurelogging) to be set during development.

#### `development.sourceMap`

Webpack `devtool` setting. Default is `source-map`. For more options please see <https://webpack.js.org/configuration/devtool/#devtool>.

#### `development.hotLoader`

Enable or disable Fast Refresh using [`react-refresh`](https://github.com/pmmmwh/react-refresh-webpack-plugin). Default is `true`.

#### `development.webpackDevServer`

> **Caution**: Please be careful when overriding defaults

Optional options for Webpack development server. If undefined, `workflow` defaults are used. Please see <https://webpack.js.org/configuration/dev-server/#devserver> for all available options.

##### Example configuration

When starting the dev server using production settings as a dry run, `yarn start --dry-run`, the dev server will need to be told where to serve bundled content from:

```js
{
    static: {
        directory: path.join(process.cwd(), 'dist'),
    },
    compress: true, // gzip content before serving
    port: 3000, // serve content on localhost:3000
  };
```

#### `development.jestOverrides`

Customize any available jest configuration option. See https://jestjs.io/docs/configuration#reference for list of configuration options. Uses lodash merge to deeply merge user config object with defaults.

**Ex:**:

```js
{
    collectCoverageFrom: ['project/app/**/*.{js,jsx,ts,tsx}', '!project/app/**/types'],
    coveragePathIgnorePatterns: ['/node_modules/', '/coverage/', '/dist/', '/types'],
}
```

#### `development.targets`

Allows developers to override the `webpack` target to match their developer environment. This is beneficial if a developer is doing their primary development environment in a browser like Chrome 57+ that already supports a lot of the ES6 features, therefore, not needing to Babelfy code completely.

This setting is is only used for development and does not effect staging/production/testing builds which default to `'browserslist: defaults'`. **@See** [https://webpack.js.org/configuration/target/](https://webpack.js.org/configuration/target/)

##### Note about `browserslist`

If your project's `package.json` contains a `browserslist` entry, that will be used in place of `development.targets`

**Examples:**

```js
targets: 'web';
```

```js
targets: ['web', 'es5];
```

```js
targets: 'browserslist: last 1 chrome version, last 1 firefox version, last 1 safari version';
```

#### `development.babelInclude`

Include additional packages from `node_modules` that should be compiled by Babel and Webpack. The default is to compile all packages that are prefixed with `@av/`

#### `development.experiments`

Enable [experimental Webpack 5 features](https://webpack.js.org/configuration/experiments/) in your configurations.

#### `app.title`

Page title to use for the generated HTML document. Default is `Availity`.

```html
<html>
    <head>
        <title>Availity</title>
    </head>
</html>
```

#### `globals`

Create globals to be used for feature flags. Globals must be defined in the workflow configuration file before they can be used as flags by a project.

```js
globals: {
    BROWSER_SUPPORTS_HTML5: true,
    EXPERIMENTAL_FEATURE: false
}
```

Once declared, override the default flag values from the command line .

**Ex:**

```bash
EXPERIMENTAL_FEATURE=true npm run production
```

By default, the following feature flags are enabled:

-   `__DEV__`: **true** when `process.env.NODE_ENV` is **development**
-   `__TEST__`: **true** when `process.env.NODE_ENV` is **test**
-   `__PROD__`: **true** when `process.env.NODE_ENV` is **production**
-   `__STAGING__`: **true** when `process.env.NODE_ENV` is **staging**
-   `process.env.NODE_ENV`: is `development`, `test`, `staging` or `production` accordingly.

> `eslint-config-availity@2.1.0` or higher is needed for the default feature toggles to be recognized as valid globals by **eslint**.

#### `mock.enabled`

Enables or disables mock server. Default is `true`.

#### `mock.port`

Mock server port number. If the port is unavailable, a random available port will be used.

Note: we will automatically update the proxy settings to reflect the port used in the case of a random port being selected.

#### `mock.latency`

Sets default latency for all mock responses

#### `mock.data`

Folder that contains the mock data files (json, images, etc). Defaults to `project/data`.

#### `mock.path`

Path to route configuration file used by Mock server to build Express routes. Defaults to `project/config/routes.json`.

#### `mock.plugins`

Array of NPM module names that enhance mock server with additional data and routes. @See https://github.com/Availity/@availity/mock-data

#### `mock.pluginContext`

Pass URL context information to mock responses so that HATEOS links traverse correctly. Defaults to `http://localhost:{development.port}/api`

#### `proxies`

Array of proxy configurations. A default configuration is enabled to proxy requests to the mock server. Each proxy configuration can have the following attributes.

-   `context`: URL context used to match the activation of the proxy per request.

**Ex:**:

```js
context: '/api';
```

-   `target`: Host and port number for proxy.
-   `enabled`: Enables or disables a proxy configuration
-   `pathRewrite`: _(Optional)_ Rewrites (using regex) the a path before sending request to proxy target.

**Ex:**

```js
pathRewrite: {
  '^/api': ''
}
```

-   `contextRewrite`: _(Optional)_ Does not work with multiple proxy contexts. When `true`:

    -   Rewrites the `Origin` and `Referer` headers from host to match the the proxy target url.
    -   Rewrites the `Location` header from proxy to the host url.
    -   Rewrites any urls of the response body (JSON only) to match the url of the host. Only URLs that match the proxy target are rewritten. This feature is useful if the proxy server sends back HATEOS links that need to work on the host. The proxy context is automatically appended to the host url if missing the a URL response.

-   `headers`: _(Optional)_ Send default headers to the proxy destination.

**Ex:**:

```js
headers: {
    RemoteUser: 'janedoe';
}
```

#### `modifyWebpackConfig`

A function which, when provided, can be used to enhance/override or replace the webpack configuration used. The function will be invoked with the current webpack configuration object and a reference to the workflow settings.

**Ex:**

```js
modifyWebpackConfig: (webpackConfig, settings) => {
    // Add Subresource Integrity (SRI) security feature
    webpackConfig.output = { crossOriginLoading: 'anonymous' };
    // Note: SriPlugin would be imported in your workflow.js to be referenced here
    webpackConfig.plugins.push(
        new SriPlugin({
            hashFuncNames: ['sha256', 'sha384'],
            // only enable it for non-development builds
            enabled: !settings.isDevelopment()
        })
    );
    return webpackConfig;
};
```

## Upgrading

[[Credit](https://github.com/typicode/husky/tree/master/src/upgrader)]

Change to the directory you want to upgrade the workflow for and run the below command.

```
npx @availity/workflow-upgrade
```

## FAQ

### Webpack 5

Please reference [the Webpack 5 migration guide](https://github.com/webpack/changelog-v5/blob/master/MIGRATION%20GUIDE.md) to familiarize yourself with the possible issues and changes needed to complete a migration for your project.

Much of the internal work and configuration changes will be handled by `@availity/workflow`, but individual projects may require extra attention.

#### How to resolve _new_ runtime errors after upgrading to Webpack 5

Please see [this section from the Webpack 5 migration guide](https://github.com/webpack/changelog-v5/blob/master/MIGRATION%20GUIDE.md#level-5-runtime-errors).

##### Example flow for troubleshooting and resolving runtime errors

###### Initial troubleshooting steps

The stacktrace should include a reference to a file or package located your `node_modules` folder. In this example our runtime error references `process.cwd()` being `undefined` from the package `vfile`.

Running the command `yarn why vfile` in our project directory will tell us why we have this dependency.

```log
spaces on  fix/process-cwd-bug via ⬢ v14.9.0
❯ yarn why vfile
yarn why v1.22.4
[1/4] 🤔  Why do we have the module "vfile"...?
[2/4] 🚚  Initialising dependency graph...
[3/4] 🔍  Finding dependency...
[4/4] 🚡  Calculating file sizes...
=> Found "vfile@2.3.0"
info Reasons this module exists
   - "react-markdown#unified" depends on it
   - Hoisted from "react-markdown#unified#vfile"
info Disk size without dependencies: "28KB"
info Disk size with unique dependencies: "104KB"
info Disk size with transitive dependencies: "104KB"
info Number of shared dependencies: 4
✨  Done in 0.91s.
```

We can see above that `vfile` is required by `react-markdown`, now we need to find out why `react-markdown` is required. Running `yarn why react-markdown` in our project gives the following results:

```log
spaces on  fix/process-cwd-bug via ⬢ v14.9.0
❯ yarn why react-markdown
yarn why v1.22.4
[1/4] 🤔  Why do we have the module "react-markdown"...?
[2/4] 🚚  Initialising dependency graph...
[3/4] 🔍  Finding dependency...
[4/4] 🚡  Calculating file sizes...
=> Found "react-markdown@4.3.1"
info Has been hoisted to "react-markdown"
info Reasons this module exists
   - Specified in "dependencies"
   - Hoisted from "@availity#spaces#react-markdown"
info Disk size without dependencies: "200KB"
info Disk size with unique dependencies: "924KB"
info Disk size with transitive dependencies: "5.36MB"
info Number of shared dependencies: 22
✨  Done in 0.93s.
```

Now we can see that `@availity/spaces` relies on `react-markdown`.

###### When to open an issue

If the runtime error is determined to be coming from an Availity package, please let us know by opening an issue and adding relevant information about which dependencies of that package are causing the issue. We will then be able to determine if we can refactor away from the offending dependency or provide a polyfill for the missing code.

###### How to resolve

This will vary on a case by case basis, but in general you will want to try and either refactor away from the dependency causing the issue, or provide a polyfill **if one has not yet been provided from this repo**. The following continues with the `vfile`, `react-markdown`, and `@availity/spaces` example from above.

Since the runtime error noted that `process.cwd()` was `undefined`, we know that we need to add a polyfill for `process` to our project. To do that, we will add the necessary dependencies and modify our webpack configuration for the project.

```log
spaces on  fix/process-cwd-bug via ⬢ v14.9.0
❯ yarn add -D process imports-loader
```

Inside `project/config/workflow.js`:

```js
const modifyWebpackConfig = (webpackConfig) => {
    webpackConfig.module.rules.push({
        test: /node_modules\/vfile\/core\.js/,
        use: [
            {
                loader: 'imports-loader',
                options: {
                    type: 'commonjs',
                    imports: ['single process/browser process']
                }
            }
        ]
    });
    return webpackConfig;
};

function config(config) {
    config.modifyWebpackConfig = modifyWebpackConfig;
    // ...rest of custom workflow config

    return config;
}

module.exports = config;
```

Now the runtime issue has been resolved! Note that this only polyfills `process` for the one package that needs it, instead of all packages. Some packages may rely on the existence of `process` to determine what type of environment they are running in, in those cases we probably wouldn't want to make `process` available to them.

[Documentation for imports-loader](https://webpack.js.org/loaders/imports-loader/)

[Link to specific vfile issue and solution](https://github.com/vfile/vfile/issues/38#issuecomment-683198538)

### Why are there so many deprecation warnings when compiling or running the dev server?

`@availity/workflow` has recently switched from the deprecated `node-sass` to `dart-sass`, which emits these upcoming deprecation warnings. [The Node API is not able to use the `--quiet-upstream` flag](https://github.com/sass/dart-sass/issues/672#issuecomment-846311746), but these warnings can be safely ignored. They will eventually be handled by Availity's UI Kit and other upstream dependencies.

### **DEPRECATED IE 11 SECTION**

#### How can I test locally running code in IE 11?

The webpack config for development does not actively support development in IE 11, even though our production config does. In both environments we will transpile our Availity packages to meet that target, and in production we take the extra step to transform all other packages and hit the IE 11 compatibility target.

Most packages will ship transpiled, but more and more are starting to drop IE 11 support. In production that still doesn't affect us, we will make necessary changes to support IE 11, but for active local development you have a few ways forward to avoid things like syntax errors inside `node_modules`:

#### Recommended Approach

This approach, requiring the least amount of investigating, is to develop locally against modern targets, then use a combination of `yarn build:production`, `yarn start --dry-run`, and something like below inside `workflow.js` to allow you to test what the production-like code will look like in IE 11.

```js
const path = require('path');

// ...

if (dryRun) {
    config.development.webpackDevServer = {
        contentBase: path.join(process.cwd(), 'dist'),
        compress: true,
        port: 3000
    };
}
```

This will instruct the webpackDevServer to serve content from your `dist` folder. Running `yarn build:production` will generate the production-like code and place it in the `dist` folder. Then, after manually setting a `dryRun` boolean to `true` inside `workflow.js` (or setting it up to take a command-line argument), you can run `yarn start --dry-run` which will start up the dev server with some production-like settings, and serve your IE 11 compatible-code for testing.

#### Other Approaches

-   Figure out which packages are causing the issue and then add them to `configuration.development.babelInclude` inside `workflow.js`

-   Alternatively, use `modifyWebpackConfig` to include the packages and specify a custom loader or rule for them https://github.com/Availity/availity-workflow#modifywebpackconfig

### **END DEPRECATED IE 11 SECTION**

### How to integrate with Visual Studio Code's [Jest plugin](https://marketplace.visualstudio.com/items?itemName=Orta.vscode-jest)?

Create `./vscode/settings.json` file with the following configuration:

```json
{
    "jest.pathToJest": "npm test -- --runInBand"
}
```

**Note**: The Jest plugin will still warn about Jest 20+ features missing but it doesn't appear to affect the plugins's functionality

### How to setup a development environment to match the deployment environment?

Update `workflow.js` using the configuration below:

```js
module.exports = (config) => {
    config.proxies = [
        {
            context: ['/api/**', '/ms/**', '!/api/v1/proxy/healthplan/**'],
            target: 'http://localhost:9999',
            enabled: true,
            logLevel: 'debug',
            pathRewrite: {
                '^/api': ''
            }
        },
        {
            context: ['/api/v1/proxy/healthplan/some/mock/path'],
            target: 'http://localhost:9999',
            enabled: true,
            logLevel: 'debug',
            pathRewrite: {
                '^/api': ''
            }
        },
        {
            context: ['/api/v1/proxy/healthplan/**'],
            target: 'http://localhost:8888',
            enabled: true,
            logLevel: 'debug',
            pathRewrite: {
                '^/api/v1/proxy/healthplan/': ''
            }
        }
    ];
    return config;
};
```

The configuration above does the following:

-   Proxy requests starting with `/ms` or `/api` to the mock server but not paths that haves segments `/api/v1/proxy/healthplan/`. This configuration allows the Availity API to be simulated from mock server.
-   Proxy requests with path `/api/v1/proxy/healthplan/some/mock/path` to the mock server. Optional configuration that is useful if an API is not available for use and needs to be mocked.
-   Proxy all requests with path segments `/api/v1/proxy/healthplan/` to the configured target `'http://localhost:8888'`. Notice the URL is being rewritten. Change the rewrite path to match your local path as needed. This configuration is useful when testing against live services.

## Contribute

-   Run `yarn` to install all dependencies
-   Use `yarn start` to use the React sample application

## Disclaimer

Open source software components distributed or made available in the Availity Materials are licensed to Company under the terms of the applicable open source license agreements, which may be found in text files included in the Availity Materials.

## License

Copyright (c) 2017-present Availity, LLC. Code released under the [the MIT license](LICENSE)
