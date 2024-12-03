import config from "../config.js";
import think from "../utils/think.js";
import copy from "../utils/immutable-clone.js";
import pug from "pug";

/**
 * Compile pug into html
 */

async function compile(input) {
  const thought = copy(input);
  return pug.render(
    thought.data,
    Object.assign(config.locals, {
      self: true,
      filename: thought.source,
      basedir: process.cwd(),
    }),
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
  thought.data = `<!-- ${config.project.name} v${config.project.version} -->\n${thought.data}\n`;
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
  return thought
    .read()
    .then(compile)
    .then(addBanner)
    .then(save)
    .catch((err) => thought.error(err));
}

/**
 * Entry point
 */

export default (changed) =>
  think({
    changed,
    build,
    rules: config.paths.pages,
    before: null,
    after: null,
  });
