import config from "../config.js";
import thoughtify from "../utils/thoughtify.js";
import think from "../utils/think.js";
import copy from "../utils/immutable-clone.js";
import pathDiff from "../utils/path-diff.js";
import slugify from "../utils/slugify.js";
import pugdoc from "../utils/pugdoc-parser.js";
import path from "path";

/**
 * Compile pug into html
 */

async function compile(input) {
  const thought = copy(input);
  const part = pugdoc(thought.data, thought.source, config.locals);

  const shortPath = pathDiff(
    path.join(process.cwd(), config.paths.roots.from),
    thought.source
  );

  if (!part) return thought.info(`skip ${shortPath}`);

  const promises = [];
  part.forEach((component) => {
    component.fragments.forEach(
      (fragment) =>
        fragment.meta.name &&
        promises.push(writeFragment(fragment, thought.destination))
    );
  });
  const fragments = await Promise.all(promises).catch((err) =>
    thought.error(err)
  );

  return thought.done(`${shortPath} (${fragments.length})`);
}

/**
 * Write component fragment
 */

async function writeFragment(fragment, parentDestination) {
  const filename = fragment.meta.name
    ? slugify(fragment.meta.name)
    : path.basename(parentDestination);

  const destination = path.resolve(path.dirname(parentDestination), filename);

  return writeFragmentHTML(fragment, destination).then((thought) =>
    writeFragmentJSON(
      fragment,
      destination,
      pathDiff(path.resolve(config.paths.roots.to), thought.destination)
    )
  );
}

/**
 * Write component fragment HTML
 */

async function writeFragmentHTML(fragment, destination) {
  const data = config.htmlComponent
    ? config.htmlComponent
        .replace("{{output}}", fragment.output || "")
        .replace("{{title}}", fragment.meta.name)
    : fragment.output;

  return addBanner(
    thoughtify({ data, destination: `${destination}.html` })
  ).write();
}

/**
 * Write component fragment JSON
 */

async function writeFragmentJSON(fragment, destination, htmlFile) {
  const source = /<example>(.+)<\/example>/s.exec(fragment.output)[1];

  const data = JSON.stringify({
    name: fragment.meta.name,
    slug: slugify(fragment.meta.name),
    // height: await puppetServer.cluster.execute(`http://localhost:3333/${htmlFile}`),
    description: fragment.meta.description,
    source,
  });

  return thoughtify({ data, destination: `${destination}.json` }).write();
}

/**
 * Add banner
 */

function addBanner(input) {
  const thought = copy(input);
  thought.data = `<!-- ${config.project.name} v${config.project.version} -->\n${thought.data}\n`;
  return thought;
}

/**
 * Compiles source pug to destination html
 */

function build(input) {
  const thought = copy(input);
  return thought
    .read()
    .then(compile)
    .catch((err) => thought.error(err));
}

/**
 * Entry point
 */

export default (changed) =>
  think({
    changed,
    build,
    rules: config.paths.parts,
    // before: () => puppetServer.start(),
    // after: () => puppetServer.stop()
  });
