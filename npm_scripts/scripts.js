require("./run");

const paths = require("./paths");
const chalk = require("chalk");

const fs = require("fs");
const mkdirp = require("mkdirp");
const path = require("path");

const browserify = require("browserify");
const envify = require("envify");
const uglify = require("uglify-js");


/**
 * Minify javascript
 */

function minify(source) {
  return browserify(source, { transform: [envify] }).bundle();
};

function banner(source) {
  return "/* " +
      process.env.npm_package_name +
      " " +
      process.env.npm_package_version +
      " */ " +
      source;
}

function save(source) {
  // make destination directory if it doesn't exist
  mkdirp(path.dirname(dst), function(err) {
    if (err) throw err;
  });

  // write destination file
  fs.writeFile(dst, this.data, function(err) {
    if (err) throw err;
    console.log("    " + chalk.blueBright(dst));
  });
}

/**
 * Build
 */

function scripts() {
  const filename = "app"; // TEMP STATIC SOLUTION

  return new Promise((resolve, reject) => {
    const src = path.resolve(
      __dirname,
      "../" + paths.SRC.scripts + filename + ".js"
    );

    const dst = path.resolve(
      __dirname,
      "../" +
        paths.DST.scripts +
        filename +
        ".v" +
        process.env.npm_package_version +
        ".js"
    );

    var stream = minify(src);

    if (stream.err) {
      return reject(stream.err);
    }

    return resolve();
  });
}

exports.default = scripts;
