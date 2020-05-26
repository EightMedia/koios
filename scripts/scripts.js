const { package, ENV, paths } = require(`${process.cwd()}/.koiosrc`);
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
  const report = new eslint().executeOnFiles(koios.changed || koios.children);
  const issues = [];

  report.results.forEach(result => {
    if (result.errorCount === 0 && result.warningCount === 0) return;
    result.messages.forEach(issue => {
      issues.push(`${pathDiff(result.filePath, process.cwd())} [${issue.line}:${issue.column}] ${issue.ruleId}\n  ${chalk.grey(issue.message)}`);
    });
  });

  if (issues.length > 0) {
    return koios.warn({
      scope: "linter",
      msg: `Found ${issues.length} issue${issues.length !== 1 ? "s" : ""} concerning ${pathDiff(process.cwd(), koios.destination)}:`,
      sub: issues
    });
  }

  return koios;
}

/**
 * Bundle
 */

async function bundle(input) {
  return new Promise(async (resolve, reject) => {
    const koios = copy(input);
    const extraConfigFile = path.resolve(path.dirname(koios.source), `${path.basename(koios.source)}.webpack`);
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

async function build(koios) {
  return koios.read()
    .then(lint)
    .then(bundle)
    // no koios.write() because scripts are written via webpack
    .then(k => k.done())
    .catch(err => koios.error(err));
}

/**
 * Entry point for koios:
 * $ node koios scripts
 */

exports.default = async function (changed) {
  changed = changed ? path.resolve(process.cwd(), changed) : null;
  const entries = await globby([
    `${paths.SRC.scripts}*.js`,
    `!${paths.SRC.scripts}*.webpack.js`
  ]);
  const promises = [];

  entries.forEach(entry => {
    const source = path.resolve(entry);
    const destination = path.resolve(paths[ENV].scripts, `${path.basename(entry, ".js")}.v${package.version}.js`);
    const children = depTree.toList({ 
      filename: source, 
      directory: paths.SRC.scripts,
      filter: path => path.indexOf('node_modules') === -1 
    });

    // skip this entry if a changed file is given which isn't imported by entry
    if (changed && !children.includes(changed)) return;

    promises.push(
      build(KoiosThought({ source, destination, changed, children }))
    );
  });

  return promises;
}