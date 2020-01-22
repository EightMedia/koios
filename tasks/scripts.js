const paths = require("./settings/paths");

const FileObject = require("./utils/file-object");

const path = require("path");
const globby = require("globby");
const webpack = require("webpack");
const TerserPlugin = require("terser-webpack-plugin");

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
          minimizer: [new TerserPlugin()]
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
    bundle(obj, babelPresets)
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
    promises.push(buildScript(obj));
  });

  return promises;
}