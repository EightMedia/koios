const { paths, locals, htmlComponent } = require(`${process.cwd()}/.koiosrc`);
const pathDiff = require("./utils/path-diff");
const slugify = require("./utils/slugify");
const FileObject = require("./utils/file-object");
const { getPugdocDocuments } = require("./utils/pugdoc-parser");
const globby = require("globby");
const chalk = require("chalk");
const path = require("path");
const pug = require("pug");
const resolveDependencies = require("pug-dependencies");
const pa11y = require("pa11y");
const puppeteer = require("puppeteer");
const checkA11y = process.argv.includes("-a11y");

/**
 * Compile pug into html
 */

function pugToHtml(obj) {
  return new Promise((resolve, reject) => {
    pug.render(obj.data, Object.assign(locals, { self: true, filename: obj.source }), 
    (err, html) => {
      if (err) return reject(err);
      obj.data = html;
      return resolve(obj);
    });
  });
}

/**
 * Pug doc parser
 */

function pugdoc(obj) {
  return new Promise((resolve, reject) => {
    const component = getPugdocDocuments(obj.data, obj.source, locals)[0];
    if (!component) {
      obj.log = { type: "info", msg: `no pug-doc in ${pathDiff(process.cwd(), obj.source)}` };
      resolve(obj); // silent resolve when pug-doc is empty
    }

    const promises = [writeFragment(component)];
    if (component.fragments) component.fragments.forEach(fragment => promises.push(writeFragment(fragment)));

    Promise.all(promises)
      .then((fragments) => {
        obj.log = pathDiff(process.cwd(), obj.destination) + ` (${fragments.length} fragment${fragments.length !== 1 ? "s" : ""})`;
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
  
  const obj = new FileObject(null, path.resolve(paths.DST.components, slugify(fragment.meta.name) + ".html"));
  obj.read(html);
  addBanner(obj);
  return obj.write();
}

/**
 * Check accessibility
 */

async function a11y(obj) {
  if (!checkA11y) return obj;

  const a11yPage = await a11yBrowser.newPage();

  return pa11y(`http://localhost:8000${path.sep}` + pathDiff(paths.DST.pages, obj.destination), 
    { browser: a11yBrowser, page: a11yPage })
    .then(report => {
      if (report) {
        obj.log = { type: "warn", msg: `${obj.destination} is compiled, but contains some a11y issues:`, verbose: [] }
        report.issues.forEach(issue => {
          obj.log.verbose.push(`${issue.code}\n    ${chalk.grey(`${issue.message}\n    ${issue.context}`)}`);
        })
      }
      return obj;
    })
    .catch(err => {
      obj.err = err;
      return obj;
    });
}

/**
 * Add banner
 */

function addBanner(obj) {
  obj.data = `<!-- ${process.env.npm_package_name} v${process.env.npm_package_version} --> ${obj.data}\n`;
  return obj;
}

/**
 * Check inside which templates folder source resides
 */

function sourceType(source) {
  return pathDiff(paths.SRC.templates, source)
    .split(path.sep)
    .shift();
}

/**
 * Compiles source pug to destination html
 */

function build(obj, type) {
  const builders = {
    pages: obj => {
      return new Promise(async (resolve, reject) => {
        obj.read()
          .then(obj => pugToHtml(obj))
          .then(obj => a11y(obj))
          .then(obj => addBanner(obj))
          .then(obj => obj.write())
          .then(obj => resolve(obj))
          .catch(err => reject(err));
      });
    },

    components: obj => {
      return new Promise(async (resolve, reject) => {
        obj.read()
          .then(obj => pugdoc(obj))
          .then(obj => resolve(obj))
          .catch(err => reject(err));
      });
    },

    icons: obj => {
      return new Promise(async (resolve, reject) => {
        obj.read()
          .then(obj => pugToHtml(obj))
          .then(obj => addBanner(obj))
          .then(obj => obj.write())
          .then(obj => resolve(obj))
          .catch(err => reject(err))
      })
    }
  };

  // get source type and use the corresponding builder
  const promise = builders[type]
    ? builders[type](obj)
    : Promise.reject(new Error("No builder defined for " + type));

  // finish the promise with an extra catch to prevent Promise.all from breaking up the chain
  // the catch returns an object containing the original source path and error object
  return promise.catch(err => {
    obj.err = err;
    return obj;
  });
}

/**
 * Entry point for run.js
 * $ node tasks/run templates
 */

exports.default = async function (changed) {
  changed = changed ? path.resolve(process.cwd(), changed) : null;
  const entries = await globby([
    `${paths.SRC.pages}**${path.sep}*.pug`,
    `!${paths.SRC.pages}**${path.sep}_*.pug`,
    `${paths.SRC.components}**${path.sep}*.pug`,
    `!${paths.SRC.components}**${path.sep}_*.pug`,
    `${paths.SRC.templates}icons${path.sep}_symbols.pug`
  ]);
  const promises = [];

  if (changed && checkA11y) a11yBrowser = await puppeteer.launch({ ignoreHTTPSErrors: true });

  entries.forEach(entry => {
    const type = sourceType(entry);
    const source = path.resolve(entry);
    const subdir = type === "pages" ? pathDiff(paths.SRC.pages, path.dirname(entry)) : "";
    const destination = path.resolve(paths.DST[type], subdir, `${path.basename(entry, ".pug")}.html`);
    const dependencies = resolveDependencies(source);

    // skip this entry if a changed file is given which isn't included or extended by entry
    if (changed && changed !== source && !dependencies.includes(changed.slice(0, -4))) return;

    // skip this entry if the filename starts with "_"
    if (path.basename(source).charAt(0) === "_" && type !== "icons") return;

    const obj = new FileObject(source, destination, changed, dependencies);
    
    promises.push(build(obj, type));
  });

  return promises;
}