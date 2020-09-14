const { package, paths, locals } = require(`${process.cwd()}/.koiosrc`);
const think = require("../utils/think");
const copy = require("../utils/immutable-clone");
const pug = require("pug");

/**
 * Compile pug into html
 */

async function compile(input) {
  const thought = copy(input);
  return pug.render(
    thought.data, 
    Object.assign(locals, { self: true, filename: thought.source }), 
    (err, html) => {
      if (err) throw err;
      thought.data = html;
      return thought;
    }
  );
}

/**
 * Add banner
 */

async function addBanner(input) {
  const thought = copy(input);
  thought.data = `<!-- ${package.name} v${package.version} -->\n${thought.data}\n`;
  return thought;
}

/*
 * Write thought to destination and say we're done
 */

async function save(input) {
  const thought = copy(input);
  await thought.write();
  return thought.done();
}

/**
 * Compiles source pug to destination html
 */

function build(input) {
  const thought = copy(input);
  return thought.read()
    .then(compile)
    .then(addBanner)
    .then(save)
    .catch(err => thought.error(err));
}

/**
 * Entry point
 */

module.exports = (changed) => think({
  changed,
  build,
  rules: paths.pages,
  before: null,
  after: null
});