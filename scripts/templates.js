const { package, ENV, paths, locals, htmlComponent } = require(`${process.cwd()}/.koiosrc`);
const KoiosThought = require("./utils/koios-thought");
const copy = require("./utils/immutable-clone");
const pathDiff = require("./utils/path-diff");
const slugify = require("./utils/slugify");
const pugdoc = require("./utils/pugdoc-parser");
const globby = require("globby");
const path = require("path");
const pug = require("pug");
const resolveDependencies = require("pug-dependencies");
const minimatch = require("minimatch");
const fs = require("fs");

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
      .then(addBanner)
      .then(k => k.write())
      .then(k => k.done()),
    
    components: async koios => koios.read()
      .then(pugComponent)
  };

  return koios => builders[type] ? builders[type](koios).catch(err => koios.error(err)) : koios.error("No builder defined for " + type);
}

/**
 * Entry point for koios:
 * $ node koios templates
 */

exports.default = async function (changed) {
  changed = changed ? path.resolve(process.cwd(), changed) : null;

  const patterns = { pages: Object.keys(paths.templates.pages) , components: Object.keys(paths.templates.components) };
  const entries = await globby([...patterns.pages, ...patterns.components], { cwd: path.resolve(paths.roots.from) });
  
  const promises = [];

  entries.forEach(entry => {
    const source = path.resolve(paths.roots.from, entry);
    const pattern = 
      patterns.pages.find((pattern) => minimatch(source, path.resolve(paths.roots.from, pattern))) ||
      patterns.components.find((pattern) => minimatch(source, path.resolve(paths.roots.from, pattern)));
    
    const type = patterns.components.includes(pattern) ? "components" : "pages";

    const destination = [
      paths.roots.to, 
      paths.templates[type][pattern]
    ];

    if (!path.extname(path.join(...destination)))
      destination.push(`${path.basename(source, ".pug")}.html`);

    const children = resolveDependencies(source);

    // skip this entry if a changed file is given which isn't included or extended by entry
    if (changed && changed !== source && !children.includes(changed.slice(0, -4))) return;

    promises.push(
      build(type)(KoiosThought({ source, destination: path.join(...destination), changed, children }))
    );
  });

  return promises;
}