const paths = require("./settings/paths");

const fs = require('fs');
const path = require("path");
const sass = require("node-sass");
const pp = require("preprocess");
const postcss = require("postcss");
const autoprefixer = require("autoprefixer");
const cssnano = require("cssnano");

const { Signale } = require("signale");
const logger = new Signale({ scope: "scripts", interactive: true });

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

    logger.await(`[%d/1] Processing`, 1);

    // read and process the file
    fs.promises.mkdir(path.dirname(dst), { recursive: true })
      .then(() => fs.promises.open(src))
      .then(fh => fh.readFile({ encoding: "UTF8" }))
      .then(scss => compile(scss))
      .then(css => pp.preprocess(css, paths.locals, { type: "css" }))
      .then(css => minify(css))
      .then(css => `/* ${process.env.npm_package_name} v${process.env.npm_package_version} */ ${css}`)
      .then(css => fs.promises.open(dst, "w").then(fh => fh.writeFile(css).then(() => fh.close())))
      .then(() => logger.success(`[1/1] Finished`))
      .then(() => resolve(dst))
      .catch(err => reject(err));
  });
};