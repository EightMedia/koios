const paths = require("./settings/paths");

const fileObject = require("./utils/file-object");
const pathDiff = require("./utils/path-diff");

const globby = require("globby");
const path = require("path");
const chalk = require("chalk");
const sass = require("node-sass");
const sassGraph = require("sass-graph");
const postcss = require("postcss");
const autoprefixer = require("autoprefixer");
const cssnano = require("cssnano");
const stylelint = require("stylelint");
const preprocess = require("preprocess").preprocess;

/**
 * Lint
 */

function lint(obj) {
  return new Promise((resolve, reject) => {
    stylelint
      .lint({
        syntax: "scss",
        files: obj.changed || obj.children,
        config: {
          "extends": "stylelint-config-recommended-scss",
          "rules": {
            "no-descending-specificity": null
          }
        },
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
            msg: `Found ${result.logs.length} issues concerning ${pathDiff(process.cwd(), obj.destination)}:`,
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
        includePaths: [path.dirname(obj.source)]
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
      .then(obj => {
        obj.data = preprocess(obj.data, paths.locals, "css");
        return obj;
      })
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
  const entries = await globby(paths.SRC.styles + "*.scss");
  const promises = [];
  
  entries.forEach(entry => {
    const source = path.resolve(entry);
    const destination = path.resolve(paths.DST.styles, `${path.basename(entry, ".scss")}.v${process.env.npm_package_version}.css`);
    const children = sassGraph.parseFile(source).index[source].imports;
    
    // skip this entry if a changed file is given which isn't imported by entry
    if (changed && !children.includes(changed)) return;

    const obj = new fileObject(source, destination, changed, children);

    promises.push(buildStyle(obj));
  });

  return promises;
}