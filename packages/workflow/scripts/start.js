const Logger = require('@availity/workflow-logger');
const chalk = require('chalk');
const webpack = require('webpack');
const merge = require('lodash/merge');
const once = require('lodash/once');
const ProgressPlugin = require('webpack/lib/ProgressPlugin');
const WebpackDevSever = require('webpack-dev-server');

const settings = require('../settings');
const webpackConfigBase = require('../webpack.config');
const webpackConfigProduction = require('../webpack.config.profile');

const proxy = require('./proxy');
const notifier = require('./notifier');
const open = require('./open');
const formatWebpackMessages = require('./format');

let server;
let ekko;

const startupMessage = once(() => {
  const wantedPort = settings.config().development.port;
  const actualPort = settings.port();
  const differentPort = wantedPort !== actualPort;
  const uri = `http://${settings.host()}:${actualPort}/`;
  Logger.box(
    `The app ${chalk.yellow(settings.pkg().name)} is running at ${chalk.green(uri)}${
      differentPort
        ? `
${chalk.yellow.bold('Warning:')} Port ${chalk.blue(wantedPort)} was already in use so we used ${chalk.blue(
            actualPort
          )}.`
        : ''
    }`
  );
});

function init() {
  settings.log();
}

function rest() {
  if (settings.isEkko()) {
    const ekkoOptions = {
      data: settings.config().ekko.data,
      routes: settings.config().ekko.routes,
      plugins: settings.config().ekko.plugins,
      port: settings.ekkoPort(),
      host: settings.host(),
      pluginContext: settings.config().ekko.pluginContext,
      logProvider() {
        return {
          log(...args) {
            Logger.log(args);
          },
          debug(...args) {
            Logger.debug(args);
          },
          info(...args) {
            Logger.info(args);
          },
          warn(...args) {
            Logger.warn(args);
          },
          error(...args) {
            Logger.error(args);
          }
        };
      }
    };

    try {
      const Ekko = require('@availity/mock-server');
      ekko = new Ekko();
      return ekko.start(ekkoOptions);
    } catch {
      Logger.error(
        "Failed to create Ekko Server. Please install '@availity/mock-server' with `yarn install @availity/mock-server --dev` or check your settings"
      );
    }
  }

  return Promise.resolve();
}

function web() {
  return new Promise((resolve, reject) => {
    let previousPercent;

    let webpackConfig;
    // Allow production version to run in development
    if (settings.isDryRun() && settings.isDevelopment()) {
      Logger.message('Using production webpack settings', 'Dry Run');
      webpackConfig = webpackConfigProduction(settings);
    } else {
      webpackConfig = webpackConfigBase(settings);
    }
    webpackConfig.plugins.push(
      new ProgressPlugin((percentage, msg) => {
        const percent = Math.round(percentage * 100);

        if (previousPercent !== percent && percent % 10 === 0) {
          Logger.info(`${chalk.dim('Webpack')} ${percent}% ${msg}`);
          previousPercent = percent;
        }
      })
    );

    const { modifyWebpackConfig } = settings.config();

    if (typeof modifyWebpackConfig === 'function') {
      webpackConfig = modifyWebpackConfig(webpackConfig, settings) || webpackConfig;
    }

    const compiler = webpack(webpackConfig);

    compiler.hooks.invalid.tap('invalid', () => {
      previousPercent = null;
      Logger.info('Started compiling');
    });

    const openBrowser = once(open);

    compiler.hooks.done.tap('done', (stats) => {
      const hasErrors = stats.hasErrors();

      // https://webpack.js.org/configuration/stats/
      const json = stats.toJson({}, true);
      const messages = formatWebpackMessages(json);

      if (!hasErrors) {
        startupMessage();
        openBrowser();
        return resolve();
      }

      if (hasErrors) {
        for (const error of messages.errors) {
          Logger.empty();
          Logger.simple(`${chalk.red(error)}`);
          Logger.empty();
        }

        Logger.failed('Failed compiling');
        Logger.empty();
        return reject(json.errors);
      }

      return resolve();
    });

    const defaults = {
      client: {
        logging: settings.infrastructureLogLevel(),
        overlay: {
          errors: false,
          warnings: false
        }
      },

      port: settings.port(),

      historyApiFallback: settings.historyFallback(),

      // Enable gzip compression of generated files.
      compress: true,

      hot: settings.enableHotLoader(),

      static: {
        directory: settings.output(),

        // Reportedly, this avoids CPU overload on some systems.
        // https://github.com/facebookincubator/create-react-app/issues/293
        watch: {
          ignored: /node_modules(\\+|\/)+(?!(@availity|@av))/
        }
      }
    };

    const devServerOptions = merge(defaults, settings.config().development.webpackDevServer);
    const proxyConfig = proxy();

    if (proxyConfig) {
      devServerOptions.proxy = proxyConfig;
    }

    server = new WebpackDevSever(devServerOptions, compiler);

    const runServer = async () => {
      try {
        Logger.info('Starting development sever');
        await server.start();
        Logger.info('Started development server');
        resolve();
      } catch (error) {
        Logger.failed('Failed to start development server');
        Logger.failed(error);
        reject(error);
      }
    };

    try {
      runServer();
    } catch (error) {
      Logger.failed(error);
    }
  });
}

async function start() {
  process.on('unhandledRejection', (reason) => {
    if (reason && reason.stack) {
      Logger.error(reason.stack);
      Logger.empty();
    }
  });

  try {
    init();
    await web();
    await notifier();
    await rest();
  } catch (error) {
    Logger.failed(`${error}

    Stack: ${error.stack}`);
  }
}

module.exports = start;
