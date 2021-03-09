const { package, paths, locals, htmlComponent } = require(`${process.cwd()}/.koiosrc`);
const thoughtify = require("../utils/thoughtify");
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
  
  const shortPath = pathDiff(path.join(process.cwd(), paths.roots.from), thought.source);

  if (!component) return thought.info(`skip ${shortPath}`);

  const promises = [writeFragment(component, thought.destination)];
  if (component.fragments) component.fragments.forEach(fragment => promises.push(writeFragment(fragment, thought.destination)));
  const fragments = await Promise.all(promises).catch(err => thought.error(err));

  return thought.done(`${shortPath} (${fragments.length})`);
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

  return addBanner(thoughtify({ data, destination })).write();
}

/**
 * Write component fragment JSON
 */

async function writeFragmentJSON(fragment, parentDestination, htmlFile) {
  const data = JSON.stringify({
    name: fragment.meta.name,
    slug: slugify(fragment.meta.name),
    height: await puppetServer.cluster.execute(`http://localhost:3333/${htmlFile}`),
    description: fragment.meta.description,
    source: fragment.output,
  });

  const destination = path.resolve(
    path.dirname(parentDestination),
    slugify(fragment.meta.name) + ".json"
  );

  return thoughtify({ data, destination }).write();
}

/**
 * Add banner
 */

function addBanner(input) {
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
    .then(compile)
    .catch(err => thought.error(err));
}

/**
 * Entry point
 */

module.exports = (changed) => think({
  changed,
  build,
  rules: paths.parts,
  before: () => puppetServer.start(),
  after: () => puppetServer.stop()
});