const paths = require("./paths");
const pathDiff = require("./path-diff");
const SpinLog = require("./spinlog");

const chalk = require("chalk");
const fsp = require("fs").promises;
const path = require("path");

const glob = require("glob-all");
const pug = require("pug");
const pugdoc = require("pug-doc");
const discodip = require("discodip");

/**
 * The locals attribute for pug rendering
 * access through self.variable
 */

const locals = Object.assign(
  {
    version: process.env.npm_package_version,
    imageSizes: require(paths.SRC.data + "image-sizes.json"),
    dataMeetUs: require(paths.SRC.data + "maak-kennis-items.json"),
  },
  require(paths.SRC.data + "template-locals.js"),
  paths.locals
);

/**
 * Get file list in a Glob manner
 */

async function getFileList(globs) {
  globs = [].concat(globs);

  return new Promise((resolve, reject) => {
    glob(globs, (err, files) => {
      if (err) reject(err);
      resolve(files);
    });
  });
}

/**
 * Compile pug into html
 */

function render(src) {
  return new Promise((resolve, reject) => {
    pug.renderFile(
      src,
      Object.assign(locals, { self: true } ),
      function(err, html) {
        if (err) reject(err);
        else resolve(html);
      }
    );
  });
}

/**
 * Process src
 */

function buildPage(src) {
  return new Promise((resolve, reject) => {
    const dir = path.normalize(paths.DST.pages + path.dirname(pathDiff(paths.SRC.pages, src)));
    const dst = dir + path.sep + path.basename(src, ".pug") + ".html";

    fsp.mkdir(dir, { recursive: true })
      .then(() => render(src))
      .then(html => `<!-- ${process.env.npm_package_name} v${process.env.npm_package_version} --> ${html}`)
      .then(html => fsp.open(dst, "w").then(fileHandle => fileHandle.writeFile(html)))
      .then(() => {
        console.log(`${chalk.greenBright(dst)}`);
        resolve(dst);
      })
      .catch(err => {
        console.log(`${chalk.redBright(dst)} (${err})`);
        reject();
      })
  });
}

/**
 * Entry point for run.js
 * $ node tasks/run templates
 */

exports.default = function templates (changed) {
  return new Promise(async (resolve, reject) => {
    const globs = [
      `${paths.SRC.pages}**${path.sep}*.pug`,
      `!${paths.SRC.pages}**${path.sep}_*.pug`,
      `${paths.SRC.components}**${path.sep}*.pug`,
      `!${paths.SRC.components}**${path.sep}_*.pug`
    ];

    const fileList = changed ? Array.of(changed) : await getFileList(globs);

    if (fileList.length > 0) {
      let buildPromises = [];

      fileList.forEach(src => {
        // check if src is inside "components" or "pages"
        const type = pathDiff(paths.SRC.templates, src)
          .split(path.sep)
          .shift();
        // check type and build accordingly
        if (type === paths.SRC.pagesFolder) buildPromises.push(buildPage(src));
      });

      // resolve entire build when all build promises are done
      Promise.allSettled(buildPromises).then(result => {
        resolve(result);
      });
    } else {
      reject(new Error(`No templates inside ${paths.SRC.pages}`));
    }
  });
};
