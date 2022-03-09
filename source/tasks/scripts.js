import config from "../config.js";
import think from "../utils/think.js";
import copy from "../utils/immutable-clone.js";
import pathDiff from "../utils/path-diff.js";
import path from "path";
import fs from "fs";
import chalk from "chalk";
import { ESLint } from "eslint";
import merge from "merge";

import { rollup } from "rollup";
import { terser } from "rollup-plugin-terser";
import nodeResolve from "@rollup/plugin-node-resolve";
import nodePolyfills from 'rollup-plugin-polyfill-node';
import commonjs from "@rollup/plugin-commonjs";
import { babel } from "@rollup/plugin-babel";
import json from "@rollup/plugin-json";
import replace from "@rollup/plugin-replace";

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

  const sourceDir = path.dirname(thought.source);
  const basename = path.basename(thought.destination, ".js");
  const minify = basename.substring(basename.length-4, basename.length) === ".min";
  
  const errors = [];

  const extraRollupConfigFile = path.resolve(sourceDir, '.rolluprc.mjs');
  const hasExtraRollupConfig = await fs.promises.access(extraRollupConfigFile)
    .then((ok) => ok === undefined && true)
    .catch(() => false);

  const { default: extraRollupConfig } = hasExtraRollupConfig && await import(extraRollupConfigFile);

  const rollupConfig = merge.recursive(true,
    {
      // external: ['stream'],
      plugins: [
        replace({ 'process.env.NODE_ENV': JSON.stringify("production"), preventAssignment: true }),
        json(),
        nodePolyfills(),
        nodeResolve({ preferBuiltins: false, browser: true }),
        commonjs({ transformMixedEsModules: true }),
        babel({ babelHelpers: "bundled", skipPreflightCheck: true, exclude: /node_modules/, sourceType: "unambiguous" }),
      ],
      output: {
        format: "iife",
        sourcemap: false,
      }
    },
    extraRollupConfig,
    {
      input: thought.source,
      onwarn ({ code, loc, message }) {
        if (code === 'THIS_IS_UNDEFINED' ) return;
        message = chalk.grey(message);
        const error = loc ? `${pathDiff(loc.file, process.cwd())} [${loc.line}:${loc.column}]\n  ${message}` : message;
        errors.push(error);
      },
      output: {
        name: thought.name,
        dir: path.dirname(thought.destination),
        banner: `/* ${config.project.name} v${config.project.version} */`,
      }
    });

  const bundle = await rollup(rollupConfig);

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

  const { output: fullOutput } = await bundle.generate(rollupConfig.output);
  thought.destination = minify ? path.join(path.dirname(thought.destination), path.basename(thought.destination, ".min.js") + ".js") : thought.destination;
  thought.data = fullOutput[0].code;
  
  /**
   * Write minified output if destination contains "min": filename.min.js
   */

  if (minify) {
    rollupConfig.output.plugins = [
      terser({
        output: { 
          comments: false 
        }
      }),
    ];

    const mini = copy(input);
    const { output: miniOutput } = await bundle.generate(rollupConfig.output);
    mini.data = miniOutput[0].code;
    mini.write();
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