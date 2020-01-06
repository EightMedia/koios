const paths = require("./settings/paths");

const fsp = require('fs').promises;
const path = require("path");
const chalk = require("chalk");
const sass = require("node-sass");
const pp = require("preprocess");
const postcss = require("postcss");
const autoprefixer = require("autoprefixer");
const cssnano = require("cssnano");
 
/**
 * Compile using node-sass
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
 * Minify (and autoprefix) using cssnano
 */
 
function minify(css) {
  return new Promise((resolve, reject) => {
    postcss([
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
      resolve(result.css);
    })
  });
}

/**
 * Entry point for run.js
 * $ node tasks/run styles
 */

exports.default = function styles(changed) {
  const filename = "all"; // TEMP STATIC SOLUTION

  return new Promise((resolve, reject) => {
    const src = path.resolve(
      __dirname,
      `../${paths.SRC.styles}${filename}.scss`
    );
    const dst = path.resolve(
      __dirname,
      `../${paths.DST.styles}${filename}.v${process.env.npm_package_version}.css`
    );

    // read and process the file
    fsp.mkdir(path.dirname(dst), { recursive: true })
      .then(() => fsp.open(src))
      .then(fh => fh.readFile({ encoding: "UTF8" }))
      .then(scss => compile(scss))
      .then(css => pp.preprocess(css, paths.locals, { type: "css" }))
      .then(css => minify(css))
      .then(css => `/* ${process.env.npm_package_name} v${process.env.npm_package_version} */ ${css}`)
      .then(css => fsp.open(dst, "w").then(fh => fh.writeFile(css)))
      .then(() => console.log(`> ${chalk.greenBright(dst)}`))
      .then(() => resolve())
      .catch(err => reject(err));
  });
};