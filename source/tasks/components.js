const { package, paths, locals, htmlComponent } = require(`${process.cwd()}/.koiosrc`);
const Thought = require("../utils/thought");
const think = require("../utils/think");
const copy = require("../utils/immutable-clone");
const pathDiff = require("../utils/path-diff");
const slugify = require("../utils/slugify");
const pugdoc = require("../utils/pugdoc-parser");
const puppetServer = require("../utils/puppet-server");
const path = require("path");

/**
 * Compile pug into html
 */

async function compile(input) {
  const thought = copy(input);
  const component = pugdoc(thought.data, thought.source, locals)[0];
  
  if (!component) return thought.info(`no pug-doc in ${pathDiff(process.cwd(), thought.source)}`);

  const promises = [writeFragment(component, thought.destination)];
  if (component.fragments) component.fragments.forEach(fragment => promises.push(writeFragment(fragment, thought.destination)));
  const fragments = await Promise.all(promises).catch(err => thought.error(err));

  return thought.done(pathDiff(process.cwd(), thought.source) + ` (${fragments.length} fragment${fragments.length !== 1 ? "s" : ""})`);
}

/**
 * Write component fragment
 */

async function writeFragment(fragment, parentDestination) {
  return writeFragmentHTML(fragment, parentDestination).then((thought) => 
    writeFragmentJSON(
      fragment,
      parentDestination,
      pathDiff(path.resolve(paths.roots.to), thought.destination))
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

  const thought = await addBanner(Thought({ data, destination }));
    
  return thought.write();
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

  const thought = await Thought({ data, destination });

  return thought.write();
}

/*
 * Prerender html fragment to determine the height
 */

async function getFragmentHeight(htmlFile) {
  try {
    const page = await puppetServer.browser.newPage();
    await page.setViewport(Object.assign(page.viewport(), { width: 1200 }));
    await page.goto(`http://localhost:3333/${htmlFile}`, { waitUntil: "networkidle2" });
    const height = await page.evaluate(() => {
      return document.body.getBoundingClientRect().height;
    });
    await page.close();
    return height;
  } catch (err) {
    throw (err);
  }
}

/**
 * Add banner
 */

async function addBanner(input) {
  const thought = copy(input);
  thought.data = `<!-- ${package.name} v${package.version} -->\n${thought.data}\n`;
  return thought;
}

/**
 * Compiles source pug to destination html
 */

function build(input) {
  const thought = copy(input);
  return thought.read()
    .then(compile);
}

/**
 * Entry point
 */

module.exports = (changed) => think({
  changed,
  build,
  rules: paths.components,
  before: () => puppetServer.start(),
  after: () => puppetServer.stop()
});