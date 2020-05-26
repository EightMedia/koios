const { package, ENV, paths, locals, htmlComponent } = require(`${process.cwd()}/.koiosrc`);
const KoiosThought = require("./utils/koios-thought");
const copy = require("./utils/immutable-clone");
const pathDiff = require("./utils/path-diff");
const slugify = require("./utils/slugify");
const pugdoc = require("./utils/pugdoc-parser");
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

async function pugPage(input) {
  const koios = copy(input);
  return pug.render(
    koios.data, 
    Object.assign(locals, { self: true, filename: koios.source }), 
    (err, html) => {
      if (err) throw err;
      koios.data = html;
      return koios;
    }
  );
}

/**
 * Pug doc parser
 */

async function pugComponent(input) {
  const koios = copy(input);
  const component = pugdoc(koios.data, koios.source, locals)[0];
  
  if (!component) return koios.info(`no pug-doc in ${pathDiff(process.cwd(), koios.source)}`);

  const promises = [writeFragment(component)];
  if (component.fragments) component.fragments.forEach(fragment => promises.push(writeFragment(fragment)));
  const fragments = await Promise.all(promises);

  return koios.done(pathDiff(process.cwd(), koios.destination) + ` (${fragments.length} fragment${fragments.length !== 1 ? "s" : ""})`);
}

/**
 * Write component fragment
 */

async function writeFragment(fragment) {
  const data = htmlComponent
    .replace("{{output}}", fragment.output || "")
    .replace("{{title}}", fragment.meta.name);
  
  const destination = path.resolve(
    paths.BLD.components,
    slugify(fragment.meta.name) + ".html"
  );

  const koios = await addBanner(KoiosThought({ data, destination }));
  return koios.write();
}

/**
 * Check accessibility
 */

async function a11y(input) { 
  const koios = copy(input);

  if (!checkA11y) return koios;

  const a11yPage = await a11yBrowser.newPage();

  const report = await pa11y(`http://localhost:8000${path.sep}` + pathDiff(paths.BLD.pages, koios.destination), 
    { browser: a11yBrowser, page: a11yPage });

  if (report) {
    koios.warn({
      msg: `${koios.destination} is compiled, but contains some a11y issues:`,
      verbose: report.issues.reduce((collection, issue) => {
        collection.push(`${issue.code}\n    ${chalk.grey(`${issue.message}\n    ${issue.context}`)}`);
      }, [])
    });
  }
  return koios;
}

/**
 * Add banner
 */

async function addBanner(input) {
  const koios = copy(input);
  koios.data = `<!-- ${package.name} v${package.version} --> ${koios.data}\n`;
  return koios;
}

/**
 * Compiles source pug to destination html
 */

function build(type) {
  const builders = {
    pages: async koios => koios.read()
      .then(pugPage)
      .then(a11y)
      .then(addBanner)
      .then(k => k.write())
      .then(k => k.done()),
    
    components: async koios => koios.read()
      .then(pugComponent),
    
    icons: async koios => koios.read()
      .then(pugPage)
      .then(addBanner)
      .then(k => k.write())
      .then(k => k.done())
  };

  return koios => builders[type] ? builders[type](koios).catch(err => koios.error(err)) : koios.error("No builder defined for " + type);
}

/**
 * Entry point for koios:
 * $ node koios templates
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
    const type = pathDiff(paths.SRC.templates, entry).split(path.sep).shift();
    const source = path.resolve(entry);
    const subdir = type === "pages" ? pathDiff(paths.SRC.pages, path.dirname(entry)) : "";
    const destination = path.resolve(paths[ENV][type], subdir, `${path.basename(entry, ".pug")}.html`);
    const children = resolveDependencies(source);

    // skip this entry if a changed file is given which isn't included or extended by entry
    if (changed && changed !== source && !children.includes(changed.slice(0, -4))) return;

    // skip this entry if the filename starts with "_"
    if (path.basename(source).charAt(0) === "_" && type !== "icons") return;

    promises.push(
      build(type)(KoiosThought({ source, destination, changed, children }))
    );
  });

  return promises;
}