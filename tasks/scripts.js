const paths = require("./settings/paths");

const pathDiff = require("./utils/path-diff");
const promiseProgress = require("./utils/promise-progress");

const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
const browserify = require("browserify");
const babelify = require("babelify");
const envify = require("envify");
const uglify = require("uglify-es");

const { Signale } = require("signale");
const logger = new Signale({ scope: "scripts", interactive: false });

/**
 * Get folder list (check for directories and return array of names)
 */

function getFolderList(src) {
  return fs.promises.readdir(src, { withFileTypes: true }).then(items => items.filter(item => { return item.isDirectory() }).map(item => item.name));
}

/**
 * Bundle javascript using Browserify
 */

function bundle(src, babelifyPresets) {
  return new Promise((resolve, reject) => {
    browserify(src)
      .transform(envify, babelify.configure({ presets: babelifyPresets }))
      .bundle((err, js) => {
        if (err) reject(err);
        else resolve(js.toString());
      });
  });
}

/**
 * Minify javascript using Uglify
 */

function minify(js) {
  return new Promise((resolve, reject) => {
    var result = uglify.minify(js);
    if (result.error) reject(result.error);
    else resolve(result.code);
  });
}

/**
 * Script
 */

function buildScript(folder) {
  return new Promise((resolve, reject) => {
    const src = `${process.cwd()}${path.sep}${paths.SRC.scripts}${folder}${path.sep}index.js`;
    const dst = `${process.cwd()}${path.sep}${paths.DST.scripts}${folder}.v${process.env.npm_package_version}.js`;

    // set presets for babelify (check if folder starts with "react-")
    const babelifyPresets = [ ["@babel/preset-env",  {
      "useBuiltIns": "entry",
      "corejs": 3.5
    } ] ];
    if (folder.substr(0, 6) === "react-") babelifyPresets.push("@babel/preset-react");
  
    // read and process the file
    fs.promises.mkdir(path.dirname(dst), { recursive: true })
      .then(() => bundle(src, babelifyPresets))
      .then(js => minify(js))
      .then(js => `/* ${process.env.npm_package_name} v${process.env.npm_package_version} */ ${js}`)
      .then(js => fs.promises.open(dst, "w").then(fh => fh.writeFile(js).then(() => fh.close())))
      .then(() => resolve({ src, dst }))
      .catch(err => reject(err));
  }).catch(err => { src, err }); // this catch prevents breaking the Promise.all
}

/**
 * Entry point for run.js
 * $ node tasks/run scripts
 */

exports.default = function scripts(changed) {
  return new Promise(async (resolve, reject) => {
    let folderList = changed
      ? Array.of(
          pathDiff(paths.SRC.scripts, changed)
            .split(path.sep)
            .shift()
        )
      : await getFolderList(paths.SRC.scripts);

    const promises = folderList.map(folder => buildScript(folder));

    return promiseProgress(promises, (i, item) => {
      if (item.err) {
        item.err.message = `[${i}/${promises.length}] ${path.basename(item.src)} → ${item.err.message}`;
        logger.error(item.err);
      }
      else logger.success(`[${i}/${promises.length}] ${item.dst}`, (Array.isArray(item.dst) && item.dst.length > 1 ? `(${item.dst.length} fragments)` : ""));
    }).then(result => {
      let errors = result.filter(item => item.err);

      if (errors.length > 0) {
        logger.warn(`Reported ${errors.length} error${errors.length !== 1 ? "s" : ""}`);
      }

      resolve();
    }).catch(err => reject(err));
  });
};
