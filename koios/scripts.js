const { paths } = require(`${process.cwd()}/.koiosrc`);
const FileObject = require("./utils/file-object");
const pathDiff = require("./utils/path-diff");
const fs = require("fs");
const path = require("path");
const globby = require("globby");
const chalk = require("chalk");
const webpack = require("webpack");
const merge = require("webpack-merge");
const TerserPlugin = require("terser-webpack-plugin");
const eslint = require("eslint").CLIEngine;
const depTree = require("dependency-tree");

/**
 * Lint
 */

function lint(obj) {
  return new Promise((resolve, reject) => {
    
    const report = new eslint().executeOnFiles(obj.changed || obj.children);

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

function bundle(obj) {
  return new Promise(async (resolve, reject) => {
    const extraConfigFile = path.resolve(path.dirname(obj.source), `webpack.${path.basename(obj.source)}`);
    const extraConfigExists = await fs.promises.stat(extraConfigFile).catch(() => false);
    const extraConfig = extraConfigExists ? require(extraConfigFile) : {};

    const baseConfig = {
        entry: obj.source,
        target: "web",
        output: {
          path: path.dirname(obj.destination),
          filename: path.basename(obj.destination),
          sourceMapFilename: path.basename(obj.destination) + ".map"
        },
        optimization: {
          minimize: true,
          minimizer: [new TerserPlugin({ sourceMap: true })]
        },
        plugins: [
          new webpack.BannerPlugin({
            banner: `${process.env.npm_package_name} v${process.env.npm_package_version}`
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
                  presets: ["@babel/preset-env"]
                }
              }
            }
          ]
        }
      };

    const config = merge(baseConfig, extraConfig);

    webpack(config,
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
    // read and process the file
    obj.read()
      .then(obj => lint(obj))
      .then(obj => bundle(obj))
      .then(obj => resolve(obj))
      .catch(err => reject(err));
  }).catch(err => err); // this catch prevents breaking the Promise.all
}

/**
 * Entry point for run.js
 * $ node tasks/run scripts
 */

exports.default = async function (changed) {
  changed = changed ? path.resolve(process.cwd(), changed) : null;
  const entries = await globby([
    `${paths.SRC.scripts}*.js`,
    `!${paths.SRC.scripts}webpack.*.js`
  ]);
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