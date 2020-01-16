const paths = require("./settings/paths");
const locals = require("./settings/template-locals");
const htmlComponent = require("./settings/html-component");

const pathDiff = require("./utils/path-diff");
const slugify = require("./utils/slugify");
const simpleStream = require("./utils/simple-stream");

const path = require("path");
const glob = require("glob-all");
const pug = require("pug");
const { getPugdocDocuments } = require("./utils/pugdoc-parser");
const resolveDependencies = require("pug-dependencies");

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
    dependencies = dependencies
      .filter(item => item.dependencies.includes(filter))
      .map(item => item.file);
  }

  return dependencies;
}

/**
 * Compile pug into html
 */

function pugToHtml(obj) {
  return new Promise((resolve, reject) => {
    pug.render(obj.data, Object.assign(locals, { self: true, filename: path.format(obj.src) }), 
    (err, html) => {
      if (err) reject(err);
      else {
        obj.data = html;
        resolve(obj);
      };
    });
  });
}

/**
 * Pug doc parser
 */

function pugdoc(obj) {
  return new Promise((resolve, reject) => {
    const component = getPugdocDocuments(obj.data, path.format(obj.src), locals)[0];
    if (!component) {
      obj.log = { type: "info", msg: `no pug-doc in ${path.format(obj.src)}` };
      resolve(obj); // silent resolve when pug-doc is empty
    }

    const promises = [writeFragment(component)];
    if (component.fragments) component.fragments.forEach(fragment => promises.push(writeFragment(fragment)));

    Promise.all(promises)
      .then((fragments) => {
        obj.log = path.format(obj.dst) + ` (${fragments.length} fragments)`;
        resolve(obj);
      })
      .catch(err => reject(err));
  });
}

/**
 * Write component fragment
 */

function writeFragment(fragment) {
  const html = htmlComponent
    .replace("{{output}}", fragment.output || "")
    .replace("{{title}}", fragment.meta.name);
  
  const obj = new simpleStream(html, path.parse(paths.DST.components + path.sep + slugify(fragment.meta.name) + ".html"));
  addBanner(obj);
  return obj.write();
}

/**
 * Check inside which templates folder src resides
 */

function sourceType(src) {
  return pathDiff(paths.SRC.templates, src)
    .split(path.sep)
    .shift();
}


/**
 * Add banner
 */

function addBanner(obj) {
  obj.data = `<!-- ${process.env.npm_package_name} v${process.env.npm_package_version} --> ${obj.data}\n`;
  return obj;
}

/**
 * Compiles source pug to destination html
 */

function build(inputPath) {
  const builders = {
    pages: src => {
      return new Promise(async (resolve, reject) => {

        new simpleStream(src, path.parse(paths.DST.pages + pathDiff(paths.SRC.pages, src.dir) + src.name + ".html"))
          .read()
          .then(obj => pugToHtml(obj))
          .then(obj => addBanner(obj))
          .then(obj => obj.write())
          .then(obj => resolve(obj))
          .catch(err => reject(err));
      });
    },

    components: src => {
      return new Promise(async (resolve, reject) => {

        new simpleStream(src, path.parse(paths.DST.components + src.name + ".html"))
          .read()
          .then(obj => pugdoc(obj))
          .then(obj => resolve(obj))
          .catch(err => reject(err));
      });
    }
  };

  // get source type and use the corresponding builder
  const src = path.parse(inputPath);
  const type = sourceType(src.dir);
  
  const promise = builders[type]
    ? builders[type](src)
    : Promise.reject(new Error("No builder defined for " + type));

  // finish the promise with an extra catch to prevent Promise.all from breaking up the chain
  // the catch returns an object containing the original source path and error object
  return promise.catch(err => {
    return { src, err };
  });
}

/**
 * Entry point for run.js
 * $ node tasks/run templates
 */

exports.default = async function templates(changed) {
  // holds build promises
  const promises = [];

  // only process the changed file or process all templates
  if (changed) {
    promises.push(build(changed));
    const dependencies = await getDependencies(changed);
    if (dependencies.length > 0)
      dependencies.forEach(file => promises.push(build(file)));
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

  return Promise.resolve(promises);
}