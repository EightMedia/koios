const paths = require("./settings/paths");
const TPL_COMPONENT = require("./settings/tpl-component");

const pathDiff = require("./utils/path-diff");
const slugify = require("./utils/slugify");

const chalk = require("chalk");
const fsp = require("fs").promises;
const path = require("path");

const glob = require("glob-all");
const pug = require("pug");
const { getPugdocDocuments } = require("../node_modules/pug-doc/lib/parser");
const resolveDependencies = require("pug-dependencies");

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
  const pd = getPugdocDocuments(pug, filename, { self: locals } );
  return Promise.resolve(pd[0]);
}

/**
 * Write component
 */

function writeComponent(component) {
  const dst = path.normalize(paths.DST.components + path.sep + slugify(component.meta.name) + ".html");
  const html = TPL_COMPONENT.replace("{{output}}", component.output || "").replace("{{title}}", component.meta.name);
  return fsp.open(dst, "w")
    .then(fh => fh.writeFile(html))
    .then(() => chalk.greenBright(dst));
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
    fsp.mkdir(paths.DST.components, { recursive: true })
      .then(() => fsp.open(src))
      .then(fh => fh.readFile({ encoding: "UTF8" }))
      .then((pug) => pugdoc(pug, src))
      .then((pd) => {
        if (!pd) return true; // silent resolve when pug-doc is empty
        if (!pd.fragments) pd.fragments = [];
        const promises = [].concat(writeComponent(pd), pd.fragments.map(writeComponent));
        return Promise.all(promises);
      })
      .then((result) => Array.isArray(result) ? console.log(`> ${result.join("\n> ")}`) : null)
      .then(() => resolve(src))
      .catch(err => {
        console.log(`> ${chalk.redBright(src)}\n${err.stack}`);
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
    .shift(); // get first foldername inside templates path
  if (type === paths.SRC.pagesFolder) return pageBuilder(file).catch(err => err);
  else if (type === paths.SRC.componentsFolder) return componentBuilder(file).catch(err => err);
  else return Promise.reject(file);
}

/**
 * Process batch according to glob and builder
 */

async function processBatch(glob, builder) {
  const fileList = await getFileList(glob);
  const buildPromises = fileList.map(file => builder(file));
  return Promise.allSettled(buildPromises);
}

/**
 * Get dependencies for pug files
 */

async function getDependencies(filter) {
  const fileList = await getFileList(`${paths.SRC.pages}**${path.sep}*.pug`);
  let dependencies = fileList.map(file => {
    return { file: file, dependencies: resolveDependencies(file) };
  });

  if (filter) {
    dependencies = dependencies.filter(item => item.dependencies.includes(filter))
                              .map(item => item.file);
  }
  
  return dependencies;
}

/**
 * Entry point for run.js
 * $ node tasks/run templates
 */

exports.default = function templates (changed) {
  return new Promise(async (resolve, reject) => {
    
    const dependencies = await getDependencies(path.resolve(changed));
    console.log(dependencies);

    // check if watcher invoked this task with a changed file
    if (changed) {
      return processChanged(changed)
        .then(result => resolve(result))
        .catch(err => err);
    }
  
    // process "pages" and "components"
    Promise.allSettled(
      [
        // process all pug templates in "pages"
        processBatch([
          `${paths.SRC.pages}**${path.sep}*.pug`,
          `!${paths.SRC.pages}**${path.sep}_*.pug`,
          `${paths.SRC.templates}icons${path.sep}_symbols.pug`
        ], pageBuilder),
      
        // process all pug templates in "components"
        processBatch([
          `${paths.SRC.components}**${path.sep}*.pug`,
          `!${paths.SRC.components}**${path.sep}_*.pug`
        ], componentBuilder)
    ]).then(result => resolve(result)).catch(err => reject(err));
  });
};
