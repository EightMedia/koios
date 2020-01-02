const paths = require("./paths");
const pathDiff = require("./path-diff");
const SpinLog = require("./spinlog");

const chalk = require("chalk");
const fsp = require("fs").promises;
const path = require("path");

const glob = require("glob-all");
const pug = require("pug");
const pugdocParser = require("../node_modules/pug-doc/lib/parser");
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
 * Pug doc parser
 */

function pugdoc(pug, filename) {
  return new Promise((resolve, reject) => {
    const pd = pugdocParser.getPugdocDocuments(pug, filename, Object.assign(locals, { self: true }));
    resolve(pd);
  });
}

/**
 * Compiles source pug to destination html
 */

const pageBuilder = function(src) {
  return new Promise((resolve, reject) => {
    const dir = path.normalize(paths.DST.pages + path.dirname(pathDiff(paths.SRC.pages, src)));
    const dst = dir + path.sep + path.basename(src, ".pug") + ".html";

    fsp.mkdir(dir, { recursive: true })
      .then(() => render(src))
      .then(html => `<!-- ${process.env.npm_package_name} v${process.env.npm_package_version} --> ${html}`)
      .then(html => fsp.open(dst, "w").then(fileHandle => fileHandle.writeFile(html)))
      .then(() => console.log(`> ${chalk.greenBright(dst)}`))
      .then(() => resolve(dst))
      .catch(err => {
        console.log(`> ${chalk.redBright(dst)}\n${err.stack}`);
        reject();
      })
  });
}

const componentBuilder = function(src) {
  return new Promise((resolve, reject) => {
    const dir = path.normalize(paths.DST.components + path.dirname(pathDiff(paths.SRC.components, src)));
    const dst = dir + path.sep + path.basename(src, ".pug") + ".html";
    
    fsp.open(src)
      .then(fileHandle => fileHandle.readFile({ encoding: "UTF8" }))
      .then((pug) => pugdoc(pug, src))
      .then((obj) => console.log(obj))
      .then(() => console.log(`> ${chalk.magenta(dst)}`))
      .then(() => resolve(dst))
      .catch(err => {
        console.log(`> ${chalk.redBright(dst)}\n${err.stack}`);
        reject();
      })
  });
}

/**
 * Process changed file given by watch task
 */

function processChanged(file) {
  const type = pathDiff(paths.SRC.templates, file)
    .split(path.sep)
    .shift();
  if (type === paths.SRC.pagesFolder) return pageBuilder(file).catch(err => err);
  else if (type === paths.SRC.componentsFolder) return componentBuilder(file).catch(err => err);
}

/**
 * Process batch according to glob and builder
 */

async function processBatch(glob, builder) {
  const fileList = await getFileList(glob);
  const promises = fileList.map(file => builder(file));
  return Promise.allSettled(promises);
}

/**
 * Entry point for run.js
 * $ node tasks/run templates
 */

exports.default = function templates (changed) {
  return new Promise((resolve, reject) => {
    
    // check if watcher invoked this task with a changed file
    if (changed) return processChanged(changed).then(resolve);
  
    // process "templates" and "components"
    Promise.allSettled(
      [
        // process all pug templates in "pages"
        processBatch([
          `${paths.SRC.pages}**${path.sep}*.pug`,
          `!${paths.SRC.pages}**${path.sep}_*.pug`
        ], pageBuilder),
      
        // process all pug templates in "components"
        processBatch([
          `${paths.SRC.components}**${path.sep}*.pug`,
          `!${paths.SRC.components}**${path.sep}_*.pug`
        ], componentBuilder)
    ]).then(result => resolve(result)).catch(err => reject(err));
  });
};
