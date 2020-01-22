const paths = require("./settings/paths");

const simpleStream = require("./utils/simple-stream");
const pathDiff = require("./utils/path-diff");

const fs = require('fs');
const path = require("path");
const chalk = require("chalk");
const sass = require("node-sass");
const sassGraph = require("sass-graph");
const postcss = require("postcss");
const autoprefixer = require("autoprefixer");
const cssnano = require("cssnano");
const stylelint = require("stylelint");

/**
 * Return list of folders files inside src (skip names starting with ".")
 */

function getFileList(src) {
  return fs.promises.readdir(src, { withFileTypes: true }).then(items => items.filter(item => { return !item.isDirectory() & item.name.charAt(0) !== "." }).map(item => item.name));
}

/**
 * Lint
 */

function lint(obj) {
  return new Promise((resolve, reject) => {
    stylelint
      .lint({
        syntax: "scss",
        files: obj.changed || obj.dependencies,
        formatter: (result, retval) => {
          retval.logs = [];
          result.forEach(file => {
            file.warnings.forEach(issue =>
              retval.logs.push(
                `${pathDiff(file.source, process.cwd())} [${issue.line}:${issue.column}]\n  ${chalk.grey(issue.text)}`
              )
            );
          });
          return retval;
        }
      })
      .then(result => {
        if (result.logs.length > 0) {
          obj.log = {
            type: "warn",
            scope: "linter",
            msg: `Found ${result.logs.length} issues concerning ${obj.dst.base}:`,
            verbose: result.logs
          };
        }
        return resolve(obj);
      })
      .catch(err => {
        obj.err = err;
        return reject(err);
      });
  });
}

/**
 * Compile using node-sass
 */

function compile(obj) {
  return new Promise((resolve, reject) => {
    sass.render(
      {
        data: obj.data,
        outputStyle: "expanded",
        includePaths: [path.dirname(path.format(obj.src))]
      },
      (err, result) => {
        if (err) {
          obj.err = err;
          return reject(obj);
        }

        obj.data = result.css;
        return resolve(obj);
      }
    );
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
        preset: [
          "default",
          {
            discardComments: {
              removeAll: true
            },
            discardDuplicates: true,
            discardEmpty: true,
            minifyFontValues: true,
            minifySelectors: true
          }
        ]
      })
    ])
      .process(obj.data, { from: undefined })
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

function buildStyle(obj) {
  return new Promise(async (resolve, reject) => {
    obj.read()
      .then(obj => lint(obj))
      .then(obj => compile(obj))
      .then(obj => minify(obj))
      .then(obj => addBanner(obj))
      .then(obj => obj.write())
      .then(obj => resolve(obj))
      .catch(err => reject(err))
  }).catch(err => err); // this catch prevents breaking the Promise.all
}

/**
 * Entry point for run.js
 * $ node tasks/run styles
 */

exports.default = async function styles(changed) {
  changed = changed ? path.resolve(process.cwd(), changed) : null;
  const entries = await getFileList(paths.SRC.styles);
  const promises = [];
  
  entries.forEach(entry => {
    const src = path.parse(path.resolve(paths.SRC.styles, entry));
    const dst = path.parse(path.resolve(paths.DST.styles, `${src.name}.v${process.env.npm_package_version}.css`));
    const dependencies = sassGraph.parseFile(path.format(src)).index[path.format(src)].imports;
    
    // skip this entry if a changed file is given and when it's not a dependency
    if (changed && !dependencies.includes(changed)) return;

    const obj = new simpleStream(src, dst, changed, dependencies);

    promises.push(buildStyle(obj));
  });

  return promises;
}