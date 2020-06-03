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
const micromatch = require("micromatch");
const globParent = require("glob-parent");
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

  const promises = [writeFragment(component, koios.destination)];
  if (component.fragments) component.fragments.forEach(fragment => promises.push(writeFragment(fragment, koios.destination)));
  const fragments = await Promise.all(promises);

  return koios.done(pathDiff(process.cwd(), koios.source) + ` (${fragments.length} fragment${fragments.length !== 1 ? "s" : ""})`);
}

/**
 * Write component fragment
 */

async function writeFragment(fragment, parentDestination) {
  const data = htmlComponent
    .replace("{{output}}", fragment.output || "")
    .replace("{{title}}", fragment.meta.name);
  
  const destination = path.resolve(
    path.dirname(parentDestination),
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

  const types = ["pages", "components"];
  const promises = [];

  while (type = types.pop()) {
    const patterns = Object.keys(paths.templates[type]);
    const entries = await globby(patterns, { cwd: path.resolve(paths.roots.from) });
  
    entries.forEach(entry => {
      const source = path.join(process.cwd(), paths.roots.from, entry);
      
      // skip this entry if a changed file is given which isn't included or extended by entry
      const children = resolveDependencies(source);
      if (changed && changed !== source && !children.includes(path.basename(changed, ".pug"))) return;
  
      // find the glob pattern that matches this source
      const pattern = patterns.find((pattern) => micromatch.isMatch(entry, pattern));
  
      const subdir = path.dirname(pathDiff(globParent(pattern), entry));
  
      // assemble the destination path and filename
      const destination = [
        process.cwd(),
        paths.roots.to, 
        paths.templates[type][pattern],
        subdir
      ];
  
      if (!path.extname(paths.templates[type][pattern]))
        destination.push(`${path.basename(source, ".pug")}.html`);
  
      // collect the build promise
      promises.push(
        build(type)(KoiosThought({ source, destination: path.join(...destination), changed, children }))
      );
    });
  }

  return promises;
}