import config from "../config.js";
import think from "../utils/think.js";
import pathDiff from "../utils/path-diff.js";
import copy from "../utils/immutable-clone.js";
import fs from "fs";
import path from "path";
import chalk from "chalk";
import * as sass from "sass";
import postcss from "postcss";
import autoprefixer from "autoprefixer";
import cleancss from "clean-css";
import stylelint from "stylelint";
import extractMediaQuery from "postcss-extract-media-query";
import normalize from "postcss-normalize-string";

/**
 * Lint
 */

async function lint(input) {
  if (process.env.NODE_ENV !== "development") return input;

  const thought = copy(input);
  const result = await stylelint.lint({
    configOverrides: {
      extends: "stylelint-config-recommended-scss",
    },
    extends: ["stylelint-config-standard-scss"],
    customSyntax: "postcss-scss",
    files: thought.changed || thought.dependencies,
    formatter: (result, retval) => {
      retval.logs = [];
      result.forEach((file) => {
        file.warnings.forEach((issue) =>
          retval.logs.push(
            `${pathDiff(file.source, process.cwd())} [${issue.line}:${
              issue.column
            }]\n  ${chalk.grey(issue.text)}`
          )
        );
      });
      return retval;
    },
  });

  if (result.logs.length > 0) {
    return thought.warn({
      scope: "linter",
      msg: `${pathDiff(process.cwd(), thought.source)}`,
      issues: result.logs,
    });
  }

  return thought;
}

/**
 * Compile using node-sass
 */

function compile(input) {
  const thought = copy(input);
  const result = sass.compileString(thought.data, {
    output: "expanded",
    loadPaths: [path.dirname(thought.source)],
  });
  thought.data = result.css;
  return thought;
}

/**
 * Minify (and autoprefix) using cssnano
 */

async function minify(input) {
  const thought = copy(input);

  const plugins = [
    autoprefixer({
      cascade: false,
    }),
    normalize({ preferredQuote: "single" }),
  ];

  // const queriesFile = path.resolve(path.dirname(thought.source), `${path.basename(thought.source, ".scss")}.queries.json`);
  // const queriesFileExists = await fs.promises.stat(queriesFile).catch(() => false);
  // const queries = queriesFileExists ? require(queriesFile) : null;

  // if (queries !== null) {
  //   plugins.push(extractMediaQuery({
  //     output: {
  //       path: path.dirname(thought.destination),
  //       name: `${path.basename(thought.destination, ".css")}-[query].[ext]`,
  //     },
  //     stats: false,
  //     extractAll: false,
  //     queries,
  //   }));
  // }

  const result = await postcss(plugins).process(thought.data, {
    from: undefined,
  });

  const minified = new cleancss().minify(result.css);

  thought.data = minified.styles;
  return thought;
}

/**
 * Banner
 */

async function addBanner(input) {
  const thought = copy(input);
  thought.data = `/* ${config.project.name} v${config.project.version} */\n${thought.data}`;
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
  return thought
    .read()
    .then(lint)
    .then(compile)
    .then(minify)
    .then(addBanner)
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
    rules: config.paths.styles,
    before: null,
    after: null,
  });
