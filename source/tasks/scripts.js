const { package, paths } = require(`${process.cwd()}/.koiosrc`);
const think = require("../utils/think");
const copy = require("../utils/immutable-clone");
const pathDiff = require("../utils/path-diff");
const thoughtify = require("../utils/thoughtify");
const path = require("path");
const fs = require("fs");
const chalk = require("chalk");
const { ESLint } = require("eslint");
const rollup = require("rollup");
const terser = require("rollup-plugin-terser").terser;
const nodeResolve = require('@rollup/plugin-node-resolve').default;
const commonjs = require("@rollup/plugin-commonjs");
const babel = require('@rollup/plugin-babel').default;
const nodeBuiltins = require("rollup-plugin-node-builtins");
const json = require("@rollup/plugin-json");
const replace = require("@rollup/plugin-replace");

/**
 * Lint
 */

async function lint(input) {
  if (process.env.NODE_ENV !== "development") return input;

  const thought = copy(input);
  const eslint = new ESLint({ 
    baseConfig: {
      "env": {
        "browser": true,
        "node": true,
      },
      "parser": "@babel/eslint-parser",
      "parserOptions": {
        "requireConfigFile": false
      },
      "extends": [
        "eslint:recommended",
        "plugin:json/recommended"
      ],
      "rules": {
        "global-require": 1,
        "no-mixed-requires": 1
      },
      "globals": {
        "window": true,
        "document": true
      }
    }
  })

  const results = await eslint.lintFiles(thought.changed || thought.dependencies);
  const issues = [];

  results.forEach(result => {
    if (result.errorCount === 0 && result.warningCount === 0) return;
    result.messages.forEach(issue => {
      issues.push(`${pathDiff(result.filePath, process.cwd())} [${issue.line}:${issue.column}] ${issue.ruleId}\n  ${chalk.grey(issue.message)}`);
    });
  });

  if (issues.length > 0) {
    return thought.warn({
      scope: "linter",
      msg: `${pathDiff(process.cwd(), thought.source)}`,
      issues
    });
  }

  return thought;
}

/**
 * Generate
 */

async function bundle(input) {
  const thought = copy(input);

  const basename = path.basename(thought.destination, ".js");
  const minify = basename.substring(basename.length-4, basename.length) === ".min";
  
  const errors = [];

  // read ".rolluprc.json"
  const config = await fs.promises.readFile(path.resolve(path.dirname(thought.source), `.rolluprc.json`))
    .then(config => JSON.parse(config))
    .catch(() => false);

  const inputOptions = {
    input: thought.source,
    plugins: [
      replace({ 'process.env.NODE_ENV': JSON.stringify("production"), preventAssignment: true }),
      json(),
      nodeBuiltins(),
      babel({ babelHelpers: "runtime", skipPreflightCheck: true, exclude: /node_modules/ }),
      nodeResolve({ preferBuiltins: true, browser: true }),
      commonjs({ transformMixedEsModules: true }),
    ],
    onwarn ({ loc, message }) {
      message = chalk.grey(message);
      const error = loc ? `${pathDiff(loc.file, process.cwd())} [${loc.line}:${loc.column}]\n  ${message}` : message;
      errors.push(error);
    }
  };

  const bundle = await rollup.rollup(inputOptions);

  if (errors.length > 0) {
    return thought.error({
      scope: "bundler",
      msg: `${pathDiff(process.cwd(), thought.source)}`,
      errors
    })
  }

  /**
   * Full output
   */

  const outputOptions = {
    format: config?.output?.format || "iife",
    name: thought.name,
    banner: `/* ${package.name} v${package.version} */`,
    plugins: [],
    globals: config?.output?.globals || {}
  };

  const { output: fullOutput } = await bundle.generate(outputOptions);
  thought.destination = minify ? path.join(path.dirname(thought.destination), path.basename(thought.destination, ".min.js") + ".js") : thought.destination;
  thought.data = fullOutput[0].code;
  
  /**
   * Write minified output if destination contains "min": filename.min.js
   */

  if (minify) {
    const minifyOptions = Object.assign(outputOptions, {
      plugins: [
        terser({
          output: { 
            comments: false 
          }
        }),
      ]
    })

    const mini = copy(input);
    const { output: miniOutput } = await bundle.generate(minifyOptions);
    mini.data = miniOutput[0].code;
    await mini.write();
  }

  return thought;
}

/*
 * Say we're done
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
    .then(bundle)
    .then(save)
    .catch(err => thought.error(err));
}

/**
 * Entry point
 */

module.exports = (changed) => think({
  changed,
  build,
  rules: paths.scripts,
  before: null,
  after: null
});