const paths = require("./settings/paths");

const FileObject = require("./utils/file-object");
const pathDiff = require("./utils/path-diff");

const path = require("path");
const globby = require("globby");
const chalk = require("chalk");
const webpack = require("webpack");
const pluginTerser = require("terser-webpack-plugin");
const eslint = require("eslint").CLIEngine;
const depTree = require("dependency-tree");

/**
 * Lint
 */

function lint(obj) {
  return new Promise((resolve, reject) => {
    const eslintExtends = ["eslint:recommended"];
    const eslintSettings = {};
    
    if (obj.isReact) {
      eslintExtends.push("plugin:react/recommended");
      eslintSettings.react = {
        "version": "detect"
      };
    }

    const report = new eslint({
      useEslintrc: false,
      baseConfig: {
        env: {
          browser: true,
          node: true
        },
        parser: "babel-eslint",
        extends: eslintExtends,
        rules: {
          "global-require": 1,
          "no-mixed-requires": 1
        },
        settings: eslintSettings,
        globals: { window: true, document: true }
      }
    }).executeOnFiles(obj.changed || obj.children);

    const issues = [];

    report.results.forEach(result => {
      if (result.errorCount === 0 && result.warningCount === 0) return;
      result.messages.forEach(issue => {
        issues.push(`${pathDiff(result.filePath, process.cwd())} [${issue.line}:${issue.column}] ${issue.ruleId}\n  ${chalk.grey(issue.message)}`);
      });
    });

    if (issues.length > 0) {
      obj.log = {
        type: "warn",
        scope: "linter",
        msg: `Found ${issues.length} issues concerning ${pathDiff(
          process.cwd(),
          obj.destination
        )}:`,
        verbose: issues
      };
    }

    return resolve(obj);
  })
}

/**
 * Bundle
 */

function bundle(obj, babelPresets) {
  return new Promise((resolve, reject) => {
    webpack(
      {
        mode: process.env.NODE_ENV,
        entry: obj.source,
        output: {
          path: path.dirname(obj.destination),
          filename: path.basename(obj.destination)
        },
        optimization: {
          minimize: true,
          minimizer: [new pluginTerser()]
        },
        module: {
          rules: [
            {
              test: /\.(js)$/,
              exclude: /node_modules/,
              use: {
                loader: "babel-loader",
                options: {
                  presets: babelPresets
                }
              }
            }
          ]
        },
        plugins: [
          new webpack.BannerPlugin({
            banner: `${process.env.npm_package_name} v${process.env.npm_package_version}`
          })
        ]
      },
      (err, stats) => {
        if (err) {
          obj.err = err;
          return reject(obj);
        }

        const info = stats.toJson();

        if (stats.hasErrors()) {
          obj.err = new Error(info.errors);
          return reject(obj);
        }

        return resolve(obj);
      }
    );
  });
}

/**
 * Build
 */

function buildScript(obj) {
  return new Promise(async (resolve, reject) => {
    const babelPresets = ["@babel/preset-env"];
    if (obj.isReact) babelPresets.push("@babel/preset-react");

    // read and process the file
    obj.read()
      .then(obj => lint(obj))
      .then(obj => bundle(obj, babelPresets))
      .then(obj => resolve(obj))
      .catch(err => reject(err));
  }).catch(err => err); // this catch prevents breaking the Promise.all
}

/**
 * Entry point for run.js
 * $ node tasks/run scripts
 */

exports.default = async function scripts(changed) {
  changed = changed ? path.resolve(process.cwd(), changed) : null;
  const entries = await globby(paths.SRC.scripts + "*.js");
  const promises = [];

  entries.forEach(entry => {
    const source = path.resolve(entry);
    const destination = path.resolve(paths.DST.scripts, `${path.basename(entry, ".js")}.v${process.env.npm_package_version}.js`);
    const children = depTree.toList({ 
      filename: source, 
      directory: paths.SRC.scripts,
      filter: path => path.indexOf('node_modules') === -1 
    });

    // skip this entry if a changed file is given which isn't imported by entry
    if (changed && !children.includes(changed)) return;

    const obj = new FileObject(source, destination, changed, children);

    // check if entry is a react app
    obj.isReact = path.basename(obj.source).substr(0, 5) === "react";

    promises.push(buildScript(obj));
  });

  return promises;
}