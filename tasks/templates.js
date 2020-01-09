const paths = require("./settings/paths");
const locals = require("./settings/template-locals");
const htmlComponent = require("./settings/html-component");

const pathDiff = require("./utils/path-diff");
const slugify = require("./utils/slugify");
const promiseProgress = require("./utils/promise-progress");

const fs = require("fs");
const path = require("path");
const glob = require("glob-all");
const pug = require("pug");
const { getPugdocDocuments } = require("./utils/pugdoc-parser");
const resolveDependencies = require("pug-dependencies");

const { Signale } = require("signale");
const logger = new Signale({ scope: "templates", interactive: false });

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
 * Get dependencies for pug files
 */

async function getDependencies(filter) {
  const fileList = await getFileList(`${paths.SRC.pages}**${path.sep}*.pug`);
  let dependencies = fileList.map(file => {
    return { file: file, dependencies: resolveDependencies(file) };
  });

  if (filter) {
    filter = path.resolve(filter).slice(0, -4);
    dependencies = dependencies.filter(item => item.dependencies.includes(filter)).map(item => item.file);
  }

  return dependencies;
}

/**
 * Compile pug into html
 */

function pug2html(code, filename) {
  return new Promise((resolve, reject) => {
    pug.render(
      code,
      Object.assign(locals, { self: true, filename } ),
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
  const pd = getPugdocDocuments(pug, filename, locals);
  return Promise.resolve(pd[0]);
}

/**
 * Write component
 */

function writeComponent(component) {
  const filename = slugify(component.meta.name) + ".html";
  const dst = path.normalize(paths.DST.components + path.sep + filename);
  const html = htmlComponent.replace("{{output}}", component.output || "").replace("{{title}}", component.meta.name);
  return fs.promises.open(dst, "w")
    .then(fh => fh.writeFile(`<!-- ${process.env.npm_package_name} v${process.env.npm_package_version} --> ${html}`).then(() => fh.close()))
    .then(() => filename);
}

/**
 * Compiles source pug to destination html
 */

function build(src) {
  const builders = {
    pages: (src) => {
      return new Promise(async (resolve, reject) => {
        const dir = path.normalize(paths.DST.pages + path.dirname(pathDiff(paths.SRC.pages, src)));
        const dst = dir + path.sep + path.basename(src, ".pug") + ".html";

        await fs.promises.mkdir(dir, { recursive: true });
        const fh = await fs.promises.open(src);
        
        fh.readFile({ encoding: "UTF8" })
          .then((pug) => {
            fh.close();
            return pug2html(pug, src);
          })
          .then(html => `<!-- ${process.env.npm_package_name} v${process.env.npm_package_version} --> ${html}`)
          .then(html => fs.promises.open(dst, "w").then(fh => fh.writeFile(html).then(() => fh.close())))
          .then(() => resolve({ src, dst }))
          .catch(err => reject(err))
      });
    },

    components: (src) => {
      return new Promise(async (resolve, reject) => {
        await fs.promises.mkdir(paths.DST.components, { recursive: true });
        const fh = await fs.promises.open(src);

        fh.readFile({ encoding: "UTF8" })
          .then((pug) => {
            fh.close();
            return pugdoc(pug, src);
          })
          .then((pd) => {
            if (!pd) return src; // silent resolve when pug-doc is empty
            const promises = [writeComponent(pd)];
            if (pd.fragments) pd.fragments.forEach(fragment => promises.push(writeComponent(fragment)));
            return Promise.all(promises);
          })
          .then((result) => resolve({ src: src, dst: result }))
          .catch(err => reject(err))
      });
    }
  }

  // get first foldername inside templates path and use the corresponding builder
  const type = pathDiff(paths.SRC.templates, src).split(path.sep).shift();
  const promise = (builders[type]) ? builders[type](src) : Promise.reject(new Error("No builder defined for " + type));

  // finish the promise with an extra catch to prevent Promise.all from breaking up the chain
  // the catch returns an object containing the original source path and error object
  return promise.catch(err => { return { src, err } });
}

/**
 * Entry point for run.js
 * $ node tasks/run templates
 */

exports.default = function templates (changed) {
  return new Promise(async (resolve, reject) => {

    // holds build promises
    const promises = [];

    // only process the changed file or process all templates
    if (changed) {
      promises.push(build(changed));
      const dependencies = await getDependencies(changed);
      if (dependencies.length > 0) dependencies.forEach(file => promises.push(build(file)));
    } else {
      const glob = [
        `${paths.SRC.pages}**${path.sep}*.pug`,
        `!${paths.SRC.pages}**${path.sep}_*.pug`,
        `${paths.SRC.components}**${path.sep}*.pug`,
        `!${paths.SRC.components}**${path.sep}_*.pug`,
        `${paths.SRC.templates}icons${path.sep}_symbols.pug`
      ];

      const fileList = await getFileList(glob);

      fileList.forEach(file => promises.push(build(file)));
    }

    // process promises
    return promiseProgress(promises, (i, item) => {
        if (item.err) {
          item.err.message = `[${i}/${promises.length}] ${path.basename(item.src)} → ${item.err.message}`;
          logger.error(item.err);
        }
        else logger.success(`[${i}/${promises.length}] ${item.src}`, (Array.isArray(item.dst) && item.dst.length > 1 ? `(${item.dst.length} fragments)` : ""));
      })
      .then(result => {
        let errors = result.filter(item => item.err);

        if (errors.length > 0) {
          logger.warn(`Reported ${errors.length} error${errors.length !== 1 ? "s" : ""}`);
        }

        resolve();
      }).catch(err => reject(err));
  });
};
