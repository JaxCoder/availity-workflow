/* eslint-disable import/no-dynamic-require */
/* eslint-disable global-require */
const Logger = require('@availity/workflow-logger');
const figures = require('figures');

function plugin({ path, settings }) {
  let plugin = settings.pkg().availityWorkflow && settings.pkg().availityWorkflow.plugin;
  plugin =
    plugin ||
    (settings.pkg().devDependencies &&
      Object.keys(settings.pkg().devDependencies).filter(p => /@availity\/workflow-plugin-.+/.test(p)));

  if (!plugin) {
    Logger.failed(`Project must be configured to use React or Angular

1. Install appropriate plugin:

${figures.pointer} npm install @availity/workflow-<react|angular>

2. Update package.json with plugin reference:

${figures.pointer}

"availityWorkflow": {
  "plugin": "@availity/workflow-<react|angular>"
}

`);

    throw new Error('Missing @availity/workflow plugin');
  }

  let fn;
  let err;

  try {
    const filePath = `${plugin}/${path}`;
    fn = require(filePath);
  } catch (error) {
    err = error;
  }

  if (!fn) {
    // Workaround when Lerna linked modules
    // eslint-disable-next-line global-require
    const relative = require('require-relative');
    try {
      fn = relative(`${plugin}/${path}`, settings.project());
    } catch (error) {
      err = error;
    }
  }

  if (!fn && err) {
    Logger.error(err);
    throw err;
  }

  const webpackConfig = fn(settings);

  return webpackConfig;
}

module.exports = plugin;
