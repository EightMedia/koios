const { paths } = require(`${process.cwd()}/.koiosrc`);
const Thought = require("../utils/thought");
const pathDiff = require("../utils/path-diff");

const fs = require("fs");
const path = require("path");

/**
 * Entry point
 */

module.exports = async function () {
  
  const thinker = { before: null, thoughts: [], after: null };
  
  for (const entry in paths.resources) {
    const source = path.resolve(entry);
    const destination = path.resolve(paths.roots.to, paths.resources[entry]);
    const err = await fs.promises.symlink(source, destination);
    const p = !err ? Thought({}).done(pathDiff(process.cwd(), source)) : Thought({}).error(err);
    thinker.thoughts.push(p);
  }

  return thinker;
}