const paths = require("./settings/paths");

const simpleStream = require("./utils/simple-stream");

const fs = require('fs');
const path = require("path");
const sass = require("node-sass");
const pp = require("preprocess");
const postcss = require("postcss");
const autoprefixer = require("autoprefixer");
const cssnano = require("cssnano");

/**
 * Get folder list (check for directories and return array of names)
 */

function getFileList(src) {
  return fs.promises.readdir(src, { withFileTypes: true }).then(items => items.filter(item => { return !item.isDirectory() & item.name.charAt(0) !== "." }).map(item => item.name));
}

/**
 * Compile using node-sass
 */

function compile(obj) {
  return new Promise((resolve, reject) => {
    sass.render({
      data: obj.data,
      outputStyle: "expanded",
      includePaths: [paths.SRC.styles]
    },
      (err, result) => {
        if (err) {
          obj.err = err;
          return reject(obj); 
        }

        obj.data = result.css;
        return resolve(obj);
      });
  });
}

/**
 * Minify (and autoprefix) using cssnano
 */

function minify(obj) {
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
  ]).process(obj.data, { from: undefined })
    .then(result => {
      obj.data = result.css;
      resolve(obj);
    })
    .catch(err => {
      obj.err = err;
      reject(obj);
    });
  });
}

/**
 * Banner
 */

function addBanner(obj) {
  obj.data = `/* ${process.env.npm_package_name} v${process.env.npm_package_version} */ ${obj.data}`;
  return obj;
}

/**
 * Build
 */

function buildStyle(entrypoint) {
  return new Promise(async (resolve, reject) => {
    const src = path.parse(paths.SRC.styles + entrypoint);
    const dst = path.parse(`${paths.DST.styles}${src.name}.v${process.env.npm_package_version}.css`);
 
    // read and process the file
    new simpleStream(src, dst)
      .read()
      .then(obj => compile(obj))
      // .then(obj => pp.preprocess(obj.content, paths.locals, { type: "css" }))
      .then(obj => minify(obj))
      .then(obj => addBanner(obj))
      .then(obj => obj.write())
      .then((obj) => resolve(obj))
      .catch(err => reject(err))
  }).catch(err => err); // this catch prevents breaking the Promise.all
}

/**
 * Entry point for run.js
 * $ node tasks/run styles
 */

exports.default = async function styles(changed) {
  let fileList = changed ? Array.of(pathDiff(paths.SRC.styles, changed).split(path.sep).shift()) : await getFileList(paths.SRC.styles);
  const promises = fileList.map(file => buildStyle(file));
  return Promise.resolve(promises);
}