import config from "../config.js";
import think from "../utils/think.js";
import copy from "../utils/immutable-clone.js";
import pathDiff from "../utils/path-diff.js";
import thoughtify from "../utils/thoughtify.js";
import path from "path";
import fs from "fs";
import chalk from "chalk";
import { ESLint } from "eslint";
import js from "@eslint/js";
import merge from "merge";

import globals from "globals";

import { rollup } from "rollup";
import terser from "@rollup/plugin-terser";
import nodeResolve from "@rollup/plugin-node-resolve";
import nodePolyfills from "rollup-plugin-polyfill-node";
import commonjs from "@rollup/plugin-commonjs";
import { babel } from "@rollup/plugin-babel";
import babelParser from "@babel/eslint-parser";
import json from "@rollup/plugin-json";
import jsonConfig from "eslint-plugin-json";

import replace from "@rollup/plugin-replace";

/**
 * Lint
 */

async function lint(input) {
  if (process.env.NODE_ENV !== "development") return input;

  const thought = copy(input);
  const eslint = new ESLint({
    baseConfig: {
      ...js.configs.recommended,
      ...jsonConfig.configs["recommended"],
      languageOptions: {
        globals: {
          ...globals.browser,
        },
        parser: babelParser,
        parserOptions: {
          requireConfigFile: false,
        },
      },
    },
  });

  const results = await eslint.lintFiles(
    thought.changed || thought.dependencies
  );
  const issues = [];

  results.forEach((result) => {
    if (result.errorCount === 0 && result.warningCount === 0) return;
    result.messages.forEach((issue) => {
      issues.push(
        `${pathDiff(result.filePath, process.cwd())} [${issue.line}:${
          issue.column
        }] ${issue.ruleId}\n  ${chalk.grey(issue.message)}`
      );
    });
  });

  if (issues.length > 0) {
    return thought.warn({
      scope: "linter",
      msg: `${pathDiff(process.cwd(), thought.source)}`,
      issues,
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
  const addFullOutput =
    basename.substring(basename.length - 4, basename.length) === ".min";

  const errors = [];

  const extraRollupConfigFile = path.resolve(sourceDir, ".rolluprc.mjs");
  const hasExtraRollupConfig = await fs.promises
    .access(extraRollupConfigFile)
    .then((ok) => ok === undefined && true)
    .catch(() => false);

  const { default: extraRollupConfig } =
    hasExtraRollupConfig && (await import(extraRollupConfigFile));

  const rollupConfig = merge.recursive(
    true,
    {
      plugins: [
        replace({
          "process.env.NODE_ENV": JSON.stringify("production"),
          preventAssignment: true,
        }),
        json(),
        nodePolyfills(),
        nodeResolve({ preferBuiltins: false, browser: true }),
        commonjs({ transformMixedEsModules: true }),
        babel({
          babelHelpers: "bundled",
          skipPreflightCheck: true,
          exclude: /node_modules/,
          sourceType: "unambiguous",
        }),
      ],
      output: {
        format: "iife",
        sourcemap: false,
      },
    },
    extraRollupConfig,
    {
      input: thought.source,
      onwarn({ code, loc, message }) {
        if (code === "THIS_IS_UNDEFINED") return;
        message = chalk.grey(message);
        const error = loc
          ? `${pathDiff(loc.file, process.cwd())} [${loc.line}:${
              loc.column
            }]\n  ${message}`
          : message;
        errors.push(error);
      },
      output: {
        name: thought.name,
        dir: path.dirname(thought.destination),
        banner: `/* @koios ${config.project.name} v${config.project.version} */`,
        plugins: [
          terser({
            output: {
              comments: function (node, comment) {
                const text = comment.value;
                return /@koios/i.test(text);
              },
            },
          }),
        ],
      },
    }
  );

  const bundle = await rollup(rollupConfig);

  if (errors.length > 0) {
    return thought.error({
      scope: "bundler",
      msg: `${pathDiff(process.cwd(), thought.source)}`,
      errors,
    });
  }

  /**
   * Minified output
   */

  const { output } = await bundle.generate(rollupConfig.output);

  for (const chunkOrAsset of output) {
    if (chunkOrAsset.type === "asset") {
      thought.data = chunkOrAsset.source;
      thought.write();
      continue;
    }

    if (chunkOrAsset.isEntry === true) {
      const entry = thoughtify({
        data: chunkOrAsset.code,
        destination: path.join(
          path.dirname(thought.destination),
          path.basename(thought.destination, ".js"),
          "index.js"
        ),
      });
      entry.write();
      continue;
    }

    const chunk = thoughtify({
      data: chunkOrAsset.code,
      destination: path.join(
        path.dirname(thought.destination),
        path.basename(thought.destination, ".js"),
        chunkOrAsset.fileName
      ),
    });
    chunk.write();
  }

  /**
   * Write full output if destination contains "min": filename.min.js
   */

  if (addFullOutput) {
    rollupConfig.output.plugins = [];
    const full = copy(input);
    full.destination = path.join(
      path.dirname(thought.destination),
      path.basename(thought.destination, ".min.js") + ".js"
    );
    const { output: fullOutput } = await bundle.generate(rollupConfig.output);
    full.data = fullOutput[0].code;
    full.write();
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
  return thought.done();
}

/**
 * Build
 */

function build(input) {
  const thought = copy(input);
  return thought
    .read()
    .then(lint)
    .then(bundle)
    .then(save)
    .catch((err) => thought.error(err));
}

/**
 * Entry point
 */

export default (changed) =>
  think({
    changed,
    build,
    rules: config.paths.scripts,
    before: null,
    after: null,
  });
