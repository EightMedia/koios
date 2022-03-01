import config from "../config.js";
import think from "../utils/think.js";
import copy from "../utils/immutable-clone.js";
import pathDiff from "../utils/path-diff.js";
import path from "path";
import fs from "fs";
import chalk from "chalk";
import { ESLint } from "eslint";
import { rollup } from "rollup";
import { terser } from "rollup-plugin-terser";
import nodeResolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import { babel } from "@rollup/plugin-babel";
import nodeBuiltins from "rollup-plugin-node-builtins";
import json from "@rollup/plugin-json";
import replace from "@rollup/plugin-replace";
import vue from "rollup-plugin-vue";

import postcssImport from "postcss-import";
import postcssUrl from "postcss-url";
import autoprefixer from "autoprefixer";
import simplevars from "postcss-simple-vars";
import nested from "postcss-nested";

const postcssConfigList = [
  postcssImport({
    nodeResolve(id, basedir) {
      // resolve alias @css, @import '@css/style.css'
      // because @css/ has 5 chars
      if (id.startsWith("@css")) {
        return path.resolve("./src/assets/styles/css", id.slice(5));
      }

      // resolve node_modules, @import '~normalize.css/normalize.css'
      // similar to how css-loader's handling of node_modules
      if (id.startsWith("~")) {
        return path.resolve("./node_modules", id.slice(1));
      }

      // resolve relative path, @import './components/style.css'
      return path.resolve(basedir, id);
    }
  }),
  simplevars,
  nested,
  postcssUrl({ url: "inline" }),
  autoprefixer({
    overrideBrowserslist: "> 1%, IE 6, Explorer >= 10, Safari >= 7"
  })
];

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
  const rollupConfig = await fs.promises.readFile(path.resolve(path.dirname(thought.source), `.rolluprc.json`))
    .then(config => JSON.parse(config))
    .catch(() => false);

  const inputOptions = {
    input: thought.source,
    plugins: [
      replace({ 'process.env.NODE_ENV': JSON.stringify("production"), preventAssignment: true }),
      json(),
      vue({ 
        target: 'browser',
        preprocessStyles: true,
        postcssPlugins: [...postcssConfigList]
      }),
      nodeBuiltins(),
      babel({ babelHelpers: "runtime", skipPreflightCheck: true, exclude: /node_modules/, extensions: ['.js', '.jsx', '.vue'] }),
      nodeResolve({ preferBuiltins: true, browser: true, extensions: ['.js', '.jsx', '.vue'] }),
      commonjs({ transformMixedEsModules: true }),
    ],
    onwarn ({ loc, message }) {
      message = chalk.grey(message);
      const error = loc ? `${pathDiff(loc.file, process.cwd())} [${loc.line}:${loc.column}]\n  ${message}` : message;
      errors.push(error);
    }
  };

  const bundle = await rollup(inputOptions);

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
    dir: path.dirname(thought.destination),
    format: rollupConfig?.output?.format || "iife",
    name: thought.name,
    banner: `/* ${config.project.name} v${config.project.version} */`,
    plugins: [],
    globals: rollupConfig?.output?.globals || {},
    sourcemap: false
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

  if (bundle) {
    await bundle.close();
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

export default (changed) => think({
  changed,
  build,
  rules: config.paths.scripts,
  before: null,
  after: null
});