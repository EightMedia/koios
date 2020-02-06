const { ENV, paths } = require(`${process.cwd()}/.koiosrc`);
const KoiosThought = require("./utils/koios-thought");
const pathDiff = require("./utils/path-diff");
const copy = require("./utils/immutable-clone");
const fs = require("fs");
const path = require("path");
const globby = require("globby");
const chalk = require("chalk");
const webpack = require("webpack");
const merge = require("webpack-merge");
const eslint = require("eslint").CLIEngine;
const depTree = require("dependency-tree");

/**
 * Lint
 */

function lint(input) {
  const koios = copy(input);
  try {
    const report = new eslint().executeOnFiles(koios.changed || koios.children);

    const issues = [];

    report.results.forEach(result => {
      if (result.errorCount === 0 && result.warningCount === 0) return;
      result.messages.forEach(issue => {
        issues.push(`${pathDiff(result.filePath, process.cwd())} [${issue.line}:${issue.column}] ${issue.ruleId}\n  ${chalk.grey(issue.message)}`);
      });
    });

    if (issues.length > 0) {
      koios.log = {
        type: "warn",
        scope: "linter",
        msg: `Found ${issues.length} issues concerning ${pathDiff(
          process.cwd(),
          koios.destination
        )}:`,
        verbose: issues
      };
    }

    return koios;
  } catch (err) {
    throw err;
  }
}

/**
 * Bundle
 */

async function bundle(input) {
  const koios = copy(input);
  return new Promise(async (resolve, reject) => {
    const extraConfigFile = path.resolve(path.dirname(koios.source), `webpack.${path.basename(koios.source)}`);
    const extraConfigExists = await fs.promises.stat(extraConfigFile).catch(() => false);
    const extraConfig = extraConfigExists ? require(extraConfigFile) : {};

    const baseConfig = {
      entry: koios.source,
      target: "web",
      output: {
        path: path.dirname(koios.destination),
        filename: path.basename(koios.destination),
        sourceMapFilename: path.basename(koios.destination) + ".map"
      },
      devtool: "source-map",
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
                presets: [
                  ["@babel/preset-env", { modules: "cjs", useBuiltIns: "usage", corejs: 3 }]
                ]
              }
            }
          }
        ]
      }
    };

    const config = merge.strategy({
      "module.rules": "replace"
    })(baseConfig, extraConfig);
    
    return webpack(config,
      (err, stats) => {
        if (err) return reject(err);
        const info = stats.toJson();
        if (stats.hasErrors()) return reject(new Error(info.errors));
        return resolve(koios);
      }
    );
  });
}

/**
 * Build
 */

async function buildScript(koios) {
  return koios.read()
    .then(k => lint(k))
    .then(k => bundle(k))
    // no koios.write() because scripts are written via webpack
    .catch(err => Object.assign({}, koios, { err }));
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
    const destination = path.resolve(paths[ENV].scripts, `${path.basename(entry, ".js")}.v${process.env.npm_package_version}.js`);
    const children = depTree.toList({ 
      filename: source, 
      directory: paths.SRC.scripts,
      filter: path => path.indexOf('node_modules') === -1 
    });

    // skip this entry if a changed file is given which isn't imported by entry
    if (changed && !children.includes(changed)) return;

    promises.push(
      buildScript(KoiosThought({ source, destination, changed, children }))
    );
  });

  return promises;
}