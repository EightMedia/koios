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

function bundle(src, dst, babelPresets) {
  return new Promise((resolve, reject) => {

    webpack(
      {
        mode: process.env.NODE_ENV,
        entry: path.resolve(process.cwd(), src),
        output: {
          path: path.resolve(process.cwd(), path.dirname(dst)),
          filename: path.basename(dst)
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
        if (err) reject(err);

        const info = stats.toJson();

        if (stats.hasErrors()) return reject(new Error(info.errors));
        if (stats.hasWarnings()) return resolve(info.warnings);

        return resolve();
      }
    );
  });
}

/**
 * Build
 */

function buildScript(folder) {
  return new Promise(async (resolve, reject) => {
    const src = `${paths.SRC.scripts}${folder}${path.sep}index.js`;
    const dst = `${paths.DST.scripts}${folder}.v${process.env.npm_package_version}.js`;
    
    await fs.promises.mkdir(path.dirname(dst), { recursive: true });

    const babelPresets = ["@babel/preset-env"];
    if (folder.substr(0, 5) === "react") babelPresets.push("@babel/preset-react");

    // read and process the file
    bundle(src, dst, babelPresets)
      .then(() => resolve({ src, dst }))
      .catch(err => reject({ src, err }));
  }).catch(err => err); // this catch prevents breaking the Promise.all
}

/**
 * Entry point for run.js
 * $ node tasks/run scripts
 */

exports.default = function scripts(changed) {
  return new Promise(async (resolve, reject) => {
    let folderList = changed ? Array.of(pathDiff(paths.SRC.scripts, changed).split(path.sep).shift()) : await getFolderList(paths.SRC.scripts);

    const promises = folderList.map(folder => buildScript(folder));

    return resolve(promises);
  });
};
