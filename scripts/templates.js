const { package, ENV, paths, locals, htmlComponent } = require(`${process.cwd()}/.koiosrc`);
const KoiosThought = require("./utils/koios-thought");
const copy = require("./utils/immutable-clone");
const pathDiff = require("./utils/path-diff");
const slugify = require("./utils/slugify");
const pugdoc = require("./utils/pugdoc-parser");
const globby = require("globby");
const micromatch = require("micromatch");
const path = require("path");
const pug = require("pug");
const resolveDependencies = require("pug-dependencies");
const globParent = require("glob-parent");
const cp = require("child_process");
const serveStatic = require("serve-static");
const http = require("http");
const finalhandler = require("finalhandler");
const killable = require("killable");

/*
 * Setup puppeteer and static-server
 */

const puppetServer = {
  puppet: null,
  server: null,

  start() {
    return new Promise((resolve, reject) => {
      if (this.puppet || this.server) this.stop();
      this.puppet = cp.fork(`${__dirname}/utils/puppet.js`, [], { silent: true });
      this.server = http.createServer((req, res) => serveStatic(paths.roots.to)(req, res, finalhandler(req, res)));
      this.server.listen(3000);
      killable(this.server);
      this.server.on("error", (err) => {});
      process.on("exit", () => puppetServer.stop());
      process.on("SIGINT", () => puppetServer.stop());
      
      this.puppet.once("message", (data) => {
        if (data = "puppeteer-ready") {
          return resolve();
        }
        
        reject(new Error("Puppeteer is not ready"));
      });
    });
  },

  stop() {
    if (this.puppet) {
      this.puppet.kill("SIGINT");
      this.puppet = null;
    }
  
    if (this.server) {
      this.server.kill();
      this.server = null;
    }
  
    process.removeListener("exit", () => puppetServer.stop());
    process.removeListener("SIGINT", () => puppetServer.stop());
  },
};

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
  return writeFragmentHTML(fragment, parentDestination).then((koiosHTML) => 
    writeFragmentJSON(
      fragment, 
      parentDestination,
      pathDiff(path.resolve(paths.roots.to), koiosHTML.destination))
  );
}

/**
 * Write component fragment HTML
 */

async function writeFragmentHTML(fragment, parentDestination) {
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
 * Write component fragment JSON
 */

async function writeFragmentJSON(fragment, parentDestination, htmlFile) {
  const data = JSON.stringify({
    name: fragment.meta.name,
    slug: slugify(fragment.meta.name),
    height: await getFragmentHeight(htmlFile),
    description: fragment.meta.description,
    source: fragment.output,
  });

  const destination = path.resolve(
    path.dirname(parentDestination),
    slugify(fragment.meta.name) + ".json"
  );

  const koios = await KoiosThought({ data, destination });

  return koios.write();
}

/*
 * Prerender html fragment to determine the height
 */

async function getFragmentHeight(htmlFile) {
  return new Promise((resolve) => {
    puppetServer.puppet.send({ url: `http://localhost:3000/${htmlFile}` });
    puppetServer.puppet.once("message", (height) => {
      resolve(height);
    });
  });
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
  
  const koios = {
    before: () => puppetServer.start(),
    promises: [], 
    after: () => puppetServer.stop()
  };

  while (type = types.pop()) {
    const patterns = Object.keys(paths.templates[type]);
    const entries = await globby(patterns, { cwd: path.resolve(paths.roots.from) });
  
    entries.forEach(entry => {
      const source = path.join(process.cwd(), paths.roots.from, entry);
      
      // skip this entry if a changed file is given which isn't included or extended by entry
      const children = resolveDependencies(source);
      if (changed && changed !== source && !children.includes(changed.slice(0, -4))) return;
  
      // find the glob pattern that matches this source
      const pattern = patterns.find((pattern) => micromatch.isMatch(entry, pattern));
  
      const subdir = path.dirname(pathDiff(globParent(pattern), entry));
  
      const filename = path.extname(paths.templates[type][pattern]) === ".html" ?
          path.basename(paths.templates[type][pattern])
            .replace(/\$\{name\}/g, path.basename(source, ".pug"))
            .replace(/\$\{version\}/g, package.version)
          : `${path.basename(source, ".pug")}.html`;

      // assemble the destination path and filename
      const destination = path.join(
        process.cwd(),
        paths.roots.to, 
        path.dirname(paths.templates[type][pattern]),
        filename
      ).replace(/\$\{dir\}/g, subdir);

      // collect the build promise
      koios.promises.push(
        build(type)(KoiosThought({ source, destination, changed, children }))
      );
    });
  }

  return koios;
}