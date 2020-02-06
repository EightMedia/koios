const { ENV, paths } = require(`${process.cwd()}/.koiosrc`);
const KoiosThought = require("./utils/koios-thought");
const pathDiff = require("./utils/path-diff");
const copy = require("./utils/immutable-clone");
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

async function lint(input) {
  const koios = copy(input);
  try {
    const result = await stylelint.lint({
        syntax: "scss",
        files: koios.changed || koios.children,
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
      koios.log = {
        type: "warn",
        scope: "linter",
        msg: `Found ${result.logs.length} issues concerning ${pathDiff(process.cwd(), koios.destination)}:`,
        verbose: result.logs
      };
    }

    return koios;
  } catch (err) {
    throw err;
  }
}

/**
 * Compile using node-sass
 */

function compile(input) {
  const koios = copy(input);
  return new Promise((resolve, reject) => {
    return sass.render(
      {
        data: koios.data,
        outputStyle: "expanded",
        includePaths: [path.dirname(koios.source)]
      },
      (err, result) => {
        if (err) return reject(err);
        koios.data = result.css;
        return resolve(koios);
      }
    );
  });
}

/**
 * Minify (and autoprefix) using cssnano
 */

async function minify(input) {
  const koios = copy(input);
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
    ]).process(koios.data, { from: undefined });
    
    koios.data = result.css;
    return koios;
  } catch (err) {
    throw err;
  }
}

/**
 * Prep
 */

async function prep(input) {
  const koios = copy(input);
  koios.data = preprocess(koios.data, paths.locals, "css");
  return koios;
}

/**
 * Banner
 */

async function addBanner(input) {
  const koios = copy(input);
  koios.data = `/* ${process.env.npm_package_name} v${process.env.npm_package_version} */ ${koios.data}`;
  return koios;
}

/**
 * Build
 * pass copy of koios to enforce immutability
 */

async function buildStyle(koios) {
  return koios.read()
    .then(k => lint(k))
    .then(k => compile(k))
    .then(k => prep(k))
    .then(k => minify(k))
    .then(k => addBanner(k))
    .then(k => k.write())
    .catch(err => Object.assign({}, koios, { err }));
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

    promises.push(
      buildStyle(KoiosThought({ source, destination, changed, children }))
    );
  });

  return promises;
}