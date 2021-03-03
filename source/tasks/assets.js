const { paths, robotsTxt } = require(`${process.cwd()}/.koiosrc`);
const thoughtify = require("../utils/thoughtify");
const pathDiff = require("../utils/path-diff");

const fs = require("fs");
const path = require("path");
const mvdir = require("mvdir");

/*
 * Write robots.txt to destination
 */

async function writeRobotsTxt() {
  const thought = thoughtify({ 
    data: robotsTxt, 
    destination: path.join(paths.roots.to, "robots.txt") 
  });
  await thought.write();
  return thought.done(`${path.join(paths.roots.to, "robots.txt")}`);
}

/**
 * Entry point
 */

module.exports = async function () {
  const thinker = { thoughts: [], after: null };

  for (const entry in paths.assets) {
    const source = path.resolve(entry);
    const destination = path.resolve(paths.roots.to, paths.assets[entry]);
    const err = process.env.NODE_ENV === "development" ? await fs.promises.symlink(source, destination) : await mvdir(source, destination, { copy: true });
    const thought = !err ? thoughtify({}).done(pathDiff(process.cwd(), source)) : thoughtify({}).error(err);
    thinker.thoughts.push(thought);
  }

  if (robotsTxt) {
    thinker.thoughts.push(writeRobotsTxt());
  }

  return thinker;
}