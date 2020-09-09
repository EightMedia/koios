const { package, ENV, paths, locals, htmlComponent } = require(`${process.cwd()}/.koiosrc`);
const Thought = require("../utils/thought");
const copy = require("../utils/immutable-clone");
const pathDiff = require("../utils/path-diff");
const getChildren = require("../utils/get-children");
const globby = require("globby");
const micromatch = require("micromatch");
const path = require("path");
const pug = require("pug");
const globParent = require("glob-parent");

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

async function build(koios) {
  return koios.read()
    .then(pugPage)
    .then(addBanner)
    .then(k => k.write())
    .then(k => k.done());
}

/**
 * Entry point for koios:
 * $ node koios pages
 */

exports.default = async function (changed) {
  changed = changed ? path.resolve(process.cwd(), changed) : null;

  const koios = { before: null, promises: [], after: null };

  const patterns = Object.keys(paths.pages);
  const entries = await globby(patterns, { cwd: path.resolve(paths.roots.from) });

  entries.forEach(entry => {
    const source = path.join(process.cwd(), paths.roots.from, entry);

    // find the glob pattern that matches this source
    const pattern = patterns.find((pattern) => micromatch.isMatch(entry, pattern));
    
    // skip this entry if a changed file is given which isn't included or extended by entry
    const children = getChildren(source);
    if (changed && changed !== source && !children.includes(changed.slice(0, -4))) return;

    const subdir = path.dirname(pathDiff(globParent(pattern), entry));

    const filename = path.extname(paths.pages[pattern]) === ".html" ?
        path.basename(paths.pages[pattern])
          .replace(/\$\{name\}/g, path.basename(source, ".pug"))
          .replace(/\$\{version\}/g, package.version)
        : `${path.basename(source, ".pug")}.html`;

    // assemble the destination path and filename
    const destination = path.join(
      process.cwd(),
      paths.roots.to, 
      path.dirname(paths.pages[pattern]),
      filename
    ).replace(/\$\{dir\}/g, subdir);

    // collect the build promise
    koios.promises.push(
      build(Thought({ source, destination, changed, children }))
    );
  });
  
  return koios;
}