const paths = require("./settings/paths");

const pathDiff = require("./utils/path-diff");
const promiseProgress = require("./utils/promise-progress");
const simpleStream = require("./utils/simple-stream");

const fs = require("fs");
const path = require("path");

const rollup = require("rollup");
const nodeResolve = require("@rollup/plugin-node-resolve");
const builtins = require("rollup-plugin-node-builtins");
const commonjs = require("@rollup/plugin-commonjs");
const terser = require("terser");

const { Signale } = require("signale");
const logger = new Signale({ scope: "scripts", interactive: false });

/**
 * Get folder list (check for directories and return array of names)
 */

function getFolderList(src) {
  return fs.promises.readdir(src, { withFileTypes: true }).then(items => items.filter(item => { return item.isDirectory() }).map(item => item.name));
}

/**
 * Bundle the entrypoint src
 */

async function bundle(src) {
  const bundle = await rollup.rollup({
    input: src,
    plugins: [builtins(), nodeResolve({ preferBuiltins: true }), commonjs()]
  });
  const { output } = await bundle.generate({ format: "iife", sourcemap: true });
  return output[0].code;
}

/**
 * Minify javascript using Uglify
 */

function minify(js) {
  return new Promise((resolve, reject) => {
    var result = terser.minify(js);
    if (result.error) reject(result.error);
    else resolve(result.code);
  });
}

/**
 * Script
 */

function buildScript(folder) {
  return new Promise(async (resolve, reject) => {
    const src = `${process.cwd()}${path.sep}${paths.SRC.scripts}${folder}${path.sep}index.js`;
    const dst = `${process.cwd()}${path.sep}${paths.DST.scripts}${folder}.v${process.env.npm_package_version}.js`;

    await fs.promises.mkdir(path.dirname(dst), { recursive: true });

    // read and process the file
    bundle(src)
      .then(js => minify(js))
      .then(js => `/* ${process.env.npm_package_name} v${process.env.npm_package_version} */ ${js}`)
      .then(js => simpleStream.write(js, dst))
      .then(() => resolve({ src, dst }))
      .catch(err => reject({ src, err }));
  }).catch(err => err); // this catch prevents breaking the Promise.all
}

/**
 * Entry point for run.js
 * $ node tasks/run scripts
 */

exports.default = function scripts(changed) {
  return new Promise(async (resolve, reject) => {
    let folderList = changed
      ? Array.of(
          pathDiff(paths.SRC.scripts, changed)
            .split(path.sep)
            .shift()
        )
      : await getFolderList(paths.SRC.scripts);

    const promises = folderList.map(folder => buildScript(folder));

    // process promises
    return promiseProgress(promises, (i, item) => {
      if (item.err) {
        item.err.message = `[${i}/${promises.length}] ${path.basename(path.dirname(item.src))} → ${item.err.message}`;
        logger.error(item.err);
      } else {
        logger.success(`[${i}/${promises.length}] ${item.dst}`);
      }
    })
      .then(result => {
        let errors = result.filter(item => item.err);

        if (errors.length > 0) {
          logger.warn(`Reported ${errors.length} error${errors.length !== 1 ? "s" : ""}`);
        }

        resolve();
      })
      .catch(err => reject(err));
  });
};
