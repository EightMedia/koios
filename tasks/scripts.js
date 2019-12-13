const paths = require("./paths");
const chalk = require("chalk");

const fs = require("fs");
const mkdirp = require("mkdirp");
const path = require("path");

const browserify = require("browserify");
const envify = require("envify");
const uglify = require("uglify-es");

/**
 * Bundle javascript using Browserify
 */

function bundle(src) {
  return new Promise(function(resolve, reject) {
    return browserify(src, { transform: [envify], basedir: paths.SRC.scripts }).bundle((err, js) => {
      if (err) reject(err);
      resolve(js.toString());
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
    resolve(result.code);
  });
}

/**
 * Build
 */

function scripts() {
  return new Promise((resolve, reject) => {
    const src = `${process.cwd()}${path.sep}${paths.SRC.scripts}app${path.sep}index.js`;
    const dst = `${process.cwd()}${path.sep}${paths.DST.scripts}app.v${process.env.npm_package_version}.js`;

    // make sure the destination exists
    mkdirp.sync(path.dirname(dst));

    // read and process the file
    bundle(src)
      .then(js => minify(js))
      .then(js => `/* ${process.env.npm_package_name} v${process.env.npm_package_version} */ ` + js)
      .then(js =>
        fs.writeFile(dst, js, err => {
          if (err) reject(err);
          console.log(`> ${dst}`);
          resolve();
        })
      )
      .catch(err => reject(err));
  });
}

exports.default = scripts;
