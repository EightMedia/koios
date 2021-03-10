const { package, paths } = require(`${process.cwd()}/.koiosrc`);
const think = require("../utils/think");
const pathDiff = require("../utils/path-diff");
const copy = require("../utils/immutable-clone");
const path = require("path");
const chalk = require("chalk");
const sass = require("node-sass");
const postcss = require("postcss");
const autoprefixer = require("autoprefixer");
const cssnano = require("cssnano");
const stylelint = require("stylelint");
const preprocess = require("preprocess").preprocess;

/**
 * Lint
 */

async function lint(input) {
  if (process.env.NODE_ENV !== "development") return input;

  const thought = copy(input);
  const result = await stylelint.lint({
      configOverrides: {
        "extends": "stylelint-config-recommended-scss"
      },
      syntax: "scss",
      files: thought.changed || thought.dependencies,
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
    return thought.warn({
      scope: "linter",
      msg: `${pathDiff(process.cwd(), thought.source)}`,
      issues: result.logs
    });
  }

  return thought;
}

/**
 * Compile using node-sass
 */

function compile(input) {
  const thought = copy(input);
  return new Promise((resolve, reject) => {
    return sass.render(
      {
        data: thought.data,
        outputStyle: "expanded",
        includePaths: [path.dirname(thought.source)]
      },
      (err, result) => {
        if (err) return reject(err);
        thought.data = result.css;
        return resolve(thought);
      }
    );
  });
}

/**
 * Minify (and autoprefix) using cssnano
 */

async function minify(input) {
  const thought = copy(input);
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
  ]).process(thought.data, { from: undefined });
  
  thought.data = result.css;
  return thought;
}

/**
 * Banner
 */

async function addBanner(input) {
  const thought = copy(input);
  thought.data = `/* ${package.name} v${package.version} */\n${thought.data}`;
  return thought;
}

/*
 * Write thought to destination and say we're done
 */

async function save(input) {
  const thought = copy(input);
  await thought.write();
  return thought.done();
}

/**
 * Build
 */

function build(input) {
  const thought = copy(input);
  return thought.read()
    .then(lint)
    .then(compile)
    .then(minify)
    .then(addBanner)
    .then(save)
    .catch(err => thought.error(err));
}

/**
 * Entry point
 */

module.exports = (changed) => think({
  changed,
  build,
  rules: paths.styles,
  before: null,
  after: null
});