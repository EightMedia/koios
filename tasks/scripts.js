const paths = require("./settings/paths");

const FileObject = require("./utils/file-object");
const pathDiff = require("./utils/path-diff");

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

function gatherImports(code) {
  const tree = esprima.parse(code, {
    sourceType: "module"
  });

  const imports = [];

  tree.body.forEach(s => {
    if (s.type === "ExpressionStatement" &&
        s.expression.type === "CallExpression" &&
        s.expression.callee.name === "require" && 
        s.expression.callee.arguments)
      {
        return imports.push(s.expression.callee.arguments[0].value);
      }

    if (s.type === "ImportDeclaration") return imports.push(s.source.value);
    
    // if (s.type === "VariableDeclaration") {
    //   return s.declarations.forEach(d => {
    //     console.log(d);
    //   })
    // }

    return imports.push(s.type);
  });

  console.log(imports);

  return imports;
}

/**
 * Lint
 */

function lint(obj) {
  return new Promise((resolve, reject) => {
    // const report = new eslint({
    //   envs: ["browser", "mocha"],
    //   useEslintrc: false,
    //   rules: {
    //     semi: 2
    //   }
    // }).executeOnFiles(obj.changed || obj.dependencies)

    // const l = [];

    // m.forEach(issue =>
    //   l.push(
    //     `${pathDiff(obj.source, process.cwd())} [${issue.line}:${issue.column}]\n  
    //     ${chalk.grey(issue.message)}`
    //   )
    // );

    // if (l.length > 0) {
    //   obj.log = {
    //     type: "warn",
    //     scope: "linter",
    //     msg: `Found ${l.length} issues concerning ${pathDiff(process.cwd(), obj.destination)}:`,
    //     verbose: l
    //   };
    // }

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
    const obj = new FileObject(source, destination, changed);
    
    obj.read().then((obj) => {
      obj.dependencies = gatherImports(obj.data);
    })


    promises.push(buildScript(obj));
  });

  return promises;
}