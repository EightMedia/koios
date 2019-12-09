const paths = require("./paths");
const chalk = require("chalk");

const fs = require("fs");
const mkdirp = require("mkdirp");
const path = require("path");

const browserify = require("browserify");
const envify = require("envify");
const uglify = require("uglify-js");

/**
 * Bundle javascript using Browserify
 */

function bundle(src) {
  return new Promise(function(resolve, reject) {
    return browserify(src, { transform: [envify] }).bundle(function(err, js) {
      if (err) reject(err);
      resolve(js.toString());
    });
  });
};

/**
 * Minify javascript using Uglify
 */

function minify(js) {
  return new Promise(function(resolve, reject) {
    var result = uglify.minify(js);
    if (result.error) reject(error);
    resolve(result.code);
  });
}

/**
 * Build
 */

function scripts() {
  const filename = "app"; // TEMP STATIC SOLUTION

  return new Promise((resolve, reject) => {
    const src = path.resolve(__dirname, `../${paths.SRC.scripts}${filename}.js`);
    const dst = path.resolve(__dirname, `../${paths.DST.scripts}${filename}.v${process.env.npm_package_version}.js`);

    // make sure the destination exists
    mkdirp(path.dirname(dst), function (err) {
      if (err) reject(err);
    });

    // read and process the file
    bundle(src)
      .then(js => minify(js))
      .then(js => `/* ${process.env.npm_package_name} v${process.env.npm_package_version} */ ` + js)
      .then(js =>
        fs.writeFile(dst, js, err => {
          if (err) reject(err);
          console.log(chalk.blueBright(`${dst}`));
          resolve();
        })
      )
      .catch(err => reject(err));
  });
}

exports.default = scripts;
