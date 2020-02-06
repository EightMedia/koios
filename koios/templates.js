const { ENV, paths, locals, htmlComponent } = require(`${process.cwd()}/.koiosrc`);
const KoiosThought = require("./utils/koios-thought");
const copy = require("./utils/immutable-clone");
const pathDiff = require("./utils/path-diff");
const slugify = require("./utils/slugify");
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

async function pugToHtml(koios) {
  try {
    return pug.render(
      koios.data, 
      Object.assign(locals, { self: true, filename: koios.source }), 
      (err, html) => {
        if (err) throw err;
        koios.data = html;
        return koios;
      }
    );
  } catch (err) {
    throw err;
  }
}

/**
 * Pug doc parser
 */

async function pugdoc(koios) {
  try {
    const component = getPugdocDocuments(koios.data, koios.source, locals)[0];
    
    if (!component) {
      koios.log = { type: "info", msg: `no pug-doc in ${pathDiff(process.cwd(), koios.source)}` };
      return koios;
    }

    const promises = [writeFragment(component)];
    if (component.fragments) component.fragments.forEach(fragment => promises.push(writeFragment(fragment)));

    const fragments = await Promise.all(promises);

    koios.log = pathDiff(process.cwd(), koios.destination) + ` (${fragments.length} fragment${fragments.length !== 1 ? "s" : ""})`;
    return koios;
  } catch (err) {
    throw err;
  }
}

/**
 * Write component fragment
 */

async function writeFragment(fragment) {
  const input = htmlComponent
    .replace("{{output}}", fragment.output || "")
    .replace("{{title}}", fragment.meta.name);
  
  const destination = path.resolve(
    paths.BLD.components,
    slugify(fragment.meta.name) + ".html"
  );

  const koios = KoiosThought({ input, destination });
  await addBanner(koios);
  return koios.write();
}

/**
 * Check accessibility
 */

async function a11y(koios) {
  if (!checkA11y) return koios;

  try {
    const a11yPage = await a11yBrowser.newPage();

    const report = await pa11y(`http://localhost:8000${path.sep}` + pathDiff(paths.BLD.pages, koios.destination), 
      { browser: a11yBrowser, page: a11yPage });

    if (report) {
      koios.log = { type: "warn", msg: `${koios.destination} is compiled, but contains some a11y issues:`, verbose: [] }
      report.issues.forEach(issue => {
        koios.log.verbose.push(`${issue.code}\n    ${chalk.grey(`${issue.message}\n    ${issue.context}`)}`);
      })
    }
    return koios;
  } catch (err) {
    throw err;
  }
}

/**
 * Add banner
 */

async function addBanner(koios) {
  koios.data = `<!-- ${process.env.npm_package_name} v${process.env.npm_package_version} --> ${koios.data}\n`;
  return koios;
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

function build(koios, type) {
  const builders = {
    pages: async koios => {
      try {
        await koios.read();
        koios = await pugToHtml(copy(koios));
        koios = await a11y(copy(koios));
        koios = await addBanner(copy(koios));
        await koios.write();
        return koios;
      } catch (err) { 
        throw err;
      }
    },

    components: async koios => {
      try {
        await koios.read();
        koios = await pugdoc(copy(koios));
        // no koios.write() because components are written via pugdoc
        return koios;
      } catch (err) {
        throw err;
      }
    },

    icons: async koios => {
      try {
        await koios.read();
        koios = await pugToHtml(copy(koios));
        koios = await addBanner(copy(koios));
        await koios.write();
        return koios;
      } catch (err) {
        throw err;
      }
    }
  };

  // check if builder is present
  if (!builders[type]) throw new Error("No builder defined for " + type);

  // use the corresponding builder
  return builders[type](koios).catch(err => {
    koios.err = err;
    return koios;
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

    promises.push(
      build(KoiosThought({ source, destination, changed, children }), type)
    );
  });

  return promises;
}