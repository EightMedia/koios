const { ENV, paths, locals, htmlComponent } = require(`${process.cwd()}/.koiosrc`);
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

async function pugToHtml(obj) {
  try {
    pug.render(
      obj.data, 
      Object.assign(locals, { self: true, filename: obj.source }), 
      (err, html) => {
        if (err) throw err;
        obj.data = html;
        return obj;
      }
    );
  } catch (err) {
    throw err;
  }
}

/**
 * Pug doc parser
 */

async function pugdoc(obj) {
  try {
    const component = getPugdocDocuments(obj.data, obj.source, locals)[0];
    
    if (!component) {
      obj.log = { type: "info", msg: `no pug-doc in ${pathDiff(process.cwd(), obj.source)}` };
      return obj;
    }

    const promises = [writeFragment(component)];
    if (component.fragments) component.fragments.forEach(fragment => promises.push(writeFragment(fragment)));

    const fragments = await Promise.all(promises);

    obj.log = pathDiff(process.cwd(), obj.destination) + ` (${fragments.length} fragment${fragments.length !== 1 ? "s" : ""})`;
    return obj;
  } catch (err) {
    throw err;
  }
}

/**
 * Write component fragment
 */

async function writeFragment(fragment) {
  const html = htmlComponent
    .replace("{{output}}", fragment.output || "")
    .replace("{{title}}", fragment.meta.name);
  
  const obj = FileObject({ input: html, destination: path.resolve(paths.BLD.components, slugify(fragment.meta.name) + ".html") });
  await addBanner(obj);
  return obj.write();
}

/**
 * Check accessibility
 */

async function a11y(obj) {
  if (!checkA11y) return obj;

  try {
    const a11yPage = await a11yBrowser.newPage();

    const report = await pa11y(`http://localhost:8000${path.sep}` + pathDiff(paths.BLD.pages, obj.destination), 
      { browser: a11yBrowser, page: a11yPage });

    if (report) {
      obj.log = { type: "warn", msg: `${obj.destination} is compiled, but contains some a11y issues:`, verbose: [] }
      report.issues.forEach(issue => {
        obj.log.verbose.push(`${issue.code}\n    ${chalk.grey(`${issue.message}\n    ${issue.context}`)}`);
      })
    }
    return obj;
  } catch (err) {
    obj.err = err;
    return obj;
  }
}

/**
 * Add banner
 */

async function addBanner(obj) {
  obj.data = `<!-- ${process.env.npm_package_name} v${process.env.npm_package_version} --> ${obj.data}\n`;
  return obj;
}

/**
 * Check inside which templates folder source resides
 */

function getSourceType(source) {
  return pathDiff(paths.SRC.templates, source)
    .split(path.sep)
    .shift();
}

/**
 * Compiles source pug to destination html
 */

function build(obj, type) {
  const builders = {
    pages: async obj => {
      try {
        await obj.read();
        await pugToHtml(obj);
        await a11y(obj);
        await addBanner(obj);
        await obj.write();
        return obj;
      } catch (err) { 
        throw err;
      }
    },

    components: async obj => {
      try {
        await obj.read();
        await pugdoc(obj);
        // no obj.write() because components are written via pugdoc
        return obj;
      } catch (err) {
        throw err;
      }
    },

    icons: async obj => {
      try {
        await obj.read();
        await pugToHtml(obj);
        await addBanner(obj);
        await obj.write();
        return obj;
      } catch (err) {
        throw err;
      }
    }
  };

  // check if builder is present
  if (!builders[type]) throw new Error("No builder defined for " + type);

  // use the corresponding builder
  return builders[type](obj).catch(err => {
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
    const type = getSourceType(entry);
    const source = path.resolve(entry);
    const subdir = type === "pages" ? pathDiff(paths.SRC.pages, path.dirname(entry)) : "";
    const destination = path.resolve(paths[ENV][type], subdir, `${path.basename(entry, ".pug")}.html`);
    const children = resolveDependencies(source);

    // skip this entry if a changed file is given which isn't included or extended by entry
    if (changed && changed !== source && !children.includes(changed.slice(0, -4))) return;

    // skip this entry if the filename starts with "_"
    if (path.basename(source).charAt(0) === "_" && type !== "icons") return;

    const obj = FileObject({ source, destination, changed, children });
    
    promises.push(build(obj, type));
  });

  return promises;
}