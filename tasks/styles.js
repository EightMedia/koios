const paths = require("./paths");
const chalk = require("chalk");

const fs = require('fs');
const mkdirp = require("mkdirp");
const path = require("path");

const sass = require("node-sass");
const pp = require("preprocess");
const postcss = require("postcss");
const autoprefixer = require("autoprefixer");
const cssnano = require("cssnano");

/**
 * Read file 
 */

function read(src) {
  return new Promise(function (resolve, reject) {
    fs.readFile(src, (err, scss) => err ? reject(err) : resolve(scss.toString()));
  });
}
 
/**
 * Compiler using node-sass
 */

function compile(scss) {
  return new Promise((resolve, reject) => {
    sass.render({
      data: scss,
      outputStyle: "expanded",
      includePaths: [paths.SRC.styles]
    },
      (err, result) => err ? reject(err) : resolve(result.css));
  });
}
 
/**
 * Main module function called by run.js
 * $ node tasks/run styles
 */

function styles() {
  const filename = "theme"; // TEMP STATIC SOLUTION

  return new Promise((resolve, reject) => {
    const src = path.resolve(
      __dirname,
      "../" + paths.SRC.styles + filename + ".scss"
    );
    const dst = path.resolve(
      __dirname,
      "../" +
      paths.DST.styles +
      filename +
      ".v" +
      process.env.npm_package_version +
      ".css"
    );

    // make sure the destination exists
    mkdirp(path.dirname(dst), function (err) {
      if (err) reject(err);
    });

    // read and process the file
    read(src)
      .then(scss => compile(scss))
      .then(css => pp.preprocess(css, paths.locals, { type: "css" }))
      .then(css => postcss([
          autoprefixer({
            cascade: false
          }),
          cssnano({
            zindex: false,
            discardComments: {
              removeAll: true
            },
            discardDuplicates: true,
            discardEmpty: true,
            minifyFontValues: true,
            minifySelectors: true
          })
        ]).process(css, { from: undefined })
          .then(result => {
            result.warnings().forEach(warn => {
              console.warn(chalk.yellow(warn.toString()));
            });
            return result.css;
          })
      )
      .then(css => "/* " + process.env.npm_package_name + " v" + process.env.npm_package_version + " */ " + css)
      .then(css => fs.writeFile(dst, css, (err) => err ?reject(err) : resolve()))
      .catch(err => reject(err));
  });
}

exports.default = styles;