import config from "../config.js";
import thoughtify from "../utils/thoughtify.js";
import pathDiff from "../utils/path-diff.js";

import fs from "fs";
import path from "path";
import mvdir from "mvdir";

/*
 * Write robots.txt to destination
 */

async function writeRobotsTxt() {
  const thought = thoughtify({ 
    data: config.robotsTxt, 
    destination: path.join(config.paths.roots.to, "robots.txt") 
  });
  await thought.write();
  return thought.done(`${path.join(config.paths.roots.to, "robots.txt")}`);
}

/**
 * Entry point
 */

export default async function () {
  const thinker = { thoughts: [], after: null };

  for (const entry in config.paths.assets) {
    const source = path.resolve(entry);
    const destination = path.resolve(config.paths.roots.to, config.paths.assets[entry]);
    const err = await mvdir(source, destination, { copy: true });
    const thought = !err ? thoughtify({}).done(pathDiff(process.cwd(), source)) : thoughtify({}).error(err);
    thinker.thoughts.push(thought);
  }

  if (config.robotsTxt) {
    thinker.thoughts.push(writeRobotsTxt());
  }

  return thinker;
}