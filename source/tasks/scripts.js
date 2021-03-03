const { package, paths } = require(`${process.cwd()}/.koiosrc`);
const think = require("../utils/think");
const copy = require("../utils/immutable-clone");
const pathDiff = require("../utils/path-diff");
const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
const webpack = require("webpack");
const merge = require("webpack-merge");
const eslint = require("eslint").CLIEngine;

/**
 * Lint
 */

function lint(input) {
  if (process.env.NODE_ENV !== "development") return input;

  const thought = copy(input);
  const report = new eslint({ 
    baseConfig: {
      "env": {
        "browser": true,
        "node": true
      },
      "parser": "@babel/eslint-parser",
      "extends": [
        "eslint:recommended"
      ],
      "rules": {
        "global-require": 1,
        "no-mixed-requires": 1
      },
      "globals": {
        "window": true,
        "document": true
      }
    }
   }).executeOnFiles(thought.changed || thought.children);
  const issues = [];

  report.results.forEach(result => {
    if (result.errorCount === 0 && result.warningCount === 0) return;
    result.messages.forEach(issue => {
      issues.push(`${pathDiff(result.filePath, process.cwd())} [${issue.line}:${issue.column}] ${issue.ruleId}\n  ${chalk.grey(issue.message)}`);
    });
  });

  if (issues.length > 0) {
    return thought.warn({
      scope: "linter",
      msg: `${pathDiff(process.cwd(), thought.source)}`,
      issues
    });
  }

  return thought;
}

/**
 * Bundle
 */

async function bundle(input) {
  return new Promise(async (resolve, reject) => {
    const thought = copy(input);

    const baseConfig = {
      entry: thought.source,
      target: "web",
      output: {
        path: path.dirname(thought.destination),
        filename: path.basename(thought.destination),
        sourceMapFilename: path.basename(thought.destination) + ".map"
      },
      devtool: "source-map",
      plugins: [
        new webpack.BannerPlugin({
          banner: `${package.name} v${package.version}`
        })
      ],
      module: {
        rules: [
          {
            test: /\.(js)$/,
            exclude: /node_modules/,
            use: {
              loader: "babel-loader",
              options: {
                presets: [
                  ["@babel/preset-env", { modules: "cjs", useBuiltIns: "usage", corejs: 3 }]
                ]
              }
            }
          }
        ]
      }
    };

    // load "webpack.config.js" if it exists
    const extraConfigFile = path.resolve(path.dirname(thought.source), `webpack.config.js`);
    const extraConfigExists = await fs.promises.stat(extraConfigFile).catch(() => false);
    const extraConfig = extraConfigExists ? require(extraConfigFile) : {};

    // load "{entry}.webpack.js" if it exists
    const entryConfigFile = path.resolve(path.dirname(thought.source), `${path.basename(thought.source, ".js")}.webpack.js`);
    const entryConfigExists = await fs.promises.stat(entryConfigFile).catch(() => false);
    const entryConfig = entryConfigExists ? require(entryConfigFile) : {};

    const config = merge(baseConfig, extraConfig, entryConfig);

    return webpack(config,
      (err, stats) => {
        if (err) return reject(err);
        const info = stats.toJson();
        if (stats.hasErrors()) return reject(new Error(info.errors));
        return resolve(thought);
      }
    );
  });
}

/*
 * Say we're done
 */

async function save(input) {
  const thought = copy(input);
  return thought.done();
}

/**
 * Build
 */

function build(input) {
  const thought = copy(input);
  return thought.read()
    .then(lint)
    .then(bundle)
    .then(save)
    .catch(err => thought.error(err));
}

/**
 * Entry point
 */

module.exports = (changed) => think({
  changed,
  build,
  rules: { ...paths.scripts, "!**/webpack.config.js": null, "!**/*.webpack.js": null },
  before: null,
  after: null
});