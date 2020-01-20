const paths = require("./settings/paths");

const pathDiff = require("./utils/path-diff");

const fs = require("fs");
const path = require("path");

const webpack = require("webpack");
const TerserPlugin = require("terser-webpack-plugin");

/**
 * Get folder list (check for directories and return array of names)
 */

function getFolderList(src) {
  return fs.promises.readdir(src, { withFileTypes: true }).then(items => items.filter(item => { return item.isDirectory() }).map(item => item.name));
}

/**
 * Bundle 
 */

function bundle(obj, babelPresets) {
  return new Promise((resolve, reject) => {
    webpack(
      {
        mode: process.env.NODE_ENV,
        entry: path.resolve(process.cwd(), path.format(obj.src)),
        output: {
          path: path.resolve(process.cwd(), obj.dst.dir),
          filename: obj.dst.base
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

        if (stats.hasWarnings()) obj.warn = info.warnings;

        return resolve(obj);
      }
    );
  });
}

/**
 * Build
 */

function buildScript(folder) {
  return new Promise(async (resolve, reject) => {
    const obj = {
      src: path.parse(`${paths.SRC.scripts}${folder}${path.sep}index.js`),
      dst: path.parse(`${paths.DST.scripts}${folder}.v${process.env.npm_package_version}.js`)
    }
    
    await fs.promises.mkdir(obj.dst.dir, { recursive: true });

    const babelPresets = ["@babel/preset-env"];
    if (folder.substr(0, 5) === "react") babelPresets.push("@babel/preset-react");

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
  let folderList = changed ? Array.of(pathDiff(paths.SRC.scripts, changed).split(path.sep).shift()) : await getFolderList(paths.SRC.scripts);
  return folderList.map(folder => buildScript(folder));
}