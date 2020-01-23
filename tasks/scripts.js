const paths = require("./settings/paths");

const FileObject = require("./utils/file-object");
const pathDiff = require("./utils/path-diff");

const fs = require("fs");
const path = require("path");
const globby = require("globby");
const chalk = require("chalk");
const webpack = require("webpack");
const pluginTerser = require("terser-webpack-plugin");
const eslint = require("eslint").CLIEngine;
const esprima = require("esprima");

/**
 * Gather imports from js file
 */

function gatherLocalImports(source) {
  const code = fs.readFileSync(source, "utf8");

  const tree = esprima.parse(code, {
    sourceType: "module"
  });

  const imports = [];

  console.log(chalk.blue(source));

  tree.body.forEach(s => {
    if (s.type === "ExpressionStatement" && 
        s.expression.callee &&
        s.expression.callee.name === "require")
      return imports.push(s.expression.arguments[0].value);

    if (s.type === "ExpressionStatement")
      return imports.push(s.expression);

    if (s.type === "ImportDeclaration") 
      return imports.push(s.source.value);

    console.log(s);

    return;
  });
  
  const localImports = imports.filter(item => typeof item === "string" && item.charAt(0) === ".").map(item => path.resolve(paths.SRC.scripts, item) + ".js");

  if (localImports.length === 0) return;

  return localImports.map(item => {
    return { path: item, children: gatherLocalImports(item) };
  });
}

/**
 * Lint
 */

function lint(obj) {
  return new Promise((resolve, reject) => {
    const report = new eslint({ parser: "babel-eslint" }).executeOnFiles(obj.changed || obj.dependencies)

    const issues = [];

    report.results.forEach(issue => {
      if (issue.errorCount === 0 && issue.warningCount === 0) return;
      issues.push(issue);
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
          path: obj.destination.dir,
          filename: obj.destination.base
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
    if (path.basename(obj.source).substr(0, 5) === "react") babelPresets.push("@babel/preset-react");

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
    const children = gatherLocalImports(source);

    // skip this entry if a changed file is given which isn't imported by entry
    if (changed && !children.includes(changed)) return;

    const obj = new FileObject(source, destination, changed, children);

    promises.push(buildScript(obj));
  });

  return promises;
}