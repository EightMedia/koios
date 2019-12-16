const paths = require("./paths");
const chalk = require("chalk");
const pathDiff = require("./path-diff");

const fs = require("fs");
const mkdirp = require("mkdirp");
const path = require("path");

const browserify = require("browserify");
const babelify = require("babelify");
const envify = require("envify");
const uglify = require("uglify-es");

/**
 * Get folder list
 */

function getFolderList(src) {
  return new Promise((resolve, reject) => {
    fs.readdir(src, (err, items) => {
      if (err) reject(err);
      else resolve(items.filter(item => fs.lstatSync(src + item).isDirectory()));
    });
  });
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

    // make sure the destination exists
    mkdirp.sync(path.dirname(dst));

    // set presets for babelify (check if folder starts with "react-")
    const babelifyPresets = [ ["@babel/preset-env",  {
      "useBuiltIns": "entry",
      "corejs": 3.5
    } ] ];
    if (folder.substr(0, 6) === "react-") babelifyPresets.push("@babel/preset-react");
  
    // read and process the file
    bundle(src, babelifyPresets)
      .then(js => minify(js))
      .then(js => `/* ${process.env.npm_package_name} v${process.env.npm_package_version} */ ${js}`)
      .then(js =>
        fs.writeFile(dst, js, err => {
          if (err) reject(err);
          else resolve(chalk.greenBright(dst));
        })
      )
      .catch(err => reject(`${chalk.redBright(src)}\n  (${err})\n`));
  }).catch(err => err); // this catch prevents breaking the Promise.all
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

    if (folderList.length > 0) {
      let buildPromises = [];

      folderList.forEach(src => {
        buildPromises.push(buildScript(src));
      });

      // resolve entire build when all build promises are done
      Promise.all(buildPromises)
        .then(function(results) {
          console.log("> " + results.join("\n> "));
          resolve(results);
        })
        .catch(err => reject(err));
    } else {
      reject(new Error(`No folders inside ${paths.SRC.scripts}`));
    }
  });
};
