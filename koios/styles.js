const { ENV, paths } = require(`${process.cwd()}/.koiosrc`);
const FileObject = require("./utils/file-object");
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

async function lint(obj) {
  try {
    const result = await stylelint.lint({
        syntax: "scss",
        files: obj.changed || obj.children,
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
      });

    if (result.logs.length > 0) {
      obj.log = {
        type: "warn",
        scope: "linter",
        msg: `Found ${result.logs.length} issues concerning ${pathDiff(process.cwd(), obj.destination)}:`,
        verbose: result.logs
      };
    }

    return obj;
  } catch (err) {
    throw err;
  }
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
        if (err) return reject(err);
        obj.data = result.css;
        return resolve(obj);
      }
    );
  });
}

/**
 * Minify (and autoprefix) using cssnano
 */

async function minify(obj) {
  try {
    const result = await postcss([
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
    ]).process(obj.data, { from: undefined });
    
    obj.data = result.css;
    return obj;
  } catch (err) {
    throw err;
  }
}

/**
 * Banner
 */

async function addBanner(obj) {
  obj.data = `/* ${process.env.npm_package_name} v${process.env.npm_package_version} */ ${obj.data}`;
  return obj;
}

/**
 * Build
 */

async function buildStyle(obj) {
  try{
    await obj.read();
    await lint(obj);
    await compile(obj);
    obj.data = preprocess(obj.data, paths.locals, "css");
    await minify(obj);
    await addBanner(obj);
    await obj.write();
    return obj;
  } catch (err) {
    obj.err = err;
    return obj;
  }
}

/**
 * Entry point for run.js
 * $ node tasks/run styles
 */

exports.default = async function (changed) {
  changed = changed ? path.resolve(process.cwd(), changed) : null;
  const entries = await globby(paths.SRC.styles + "*.scss");
  const promises = [];

  entries.forEach(entry => {
    const source = path.resolve(entry);
    const destination = path.resolve(paths[ENV].styles, `${path.basename(entry, ".scss")}.v${process.env.npm_package_version}.css`);
    const children = sassGraph.parseFile(source).index[source].imports;
    
    // skip this entry if a changed file is given which isn't imported by entry
    if (changed && !children.includes(changed)) return;

    const obj = FileObject({ source, destination, changed, children });

    promises.push(buildStyle(obj));
  });

  return promises;
}