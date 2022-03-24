import config from "../config.js";
import thoughtify from "./thoughtify.js";
import getDependencies from "./get-dependencies.js";
import pathDiff from "./path-diff.js";
import { globby } from "globby";
import micromatch from "micromatch";
import globParent from "glob-parent";
import camelize from "camelize";
import path from "path";

/**
 * Think thoughts
 */

export default async function ({ changed, build, rules, before, after }) {
  changed = changed ? path.resolve(process.cwd(), changed) : null;
  
  if (typeof before === "function") await before();

  const thinker = { thoughts: [], after };
  const patterns = Object.keys(rules);
  const entries = await globby(patterns, { cwd: path.resolve(config.paths.roots.from) });

  entries.forEach(entry => {
    const source = path.join(process.cwd(), config.paths.roots.from, entry);

    // find the glob pattern that matches this source
    const pattern = patterns.find((pattern) => micromatch.isMatch(entry, pattern));
    
    // skip this entry if a changed file is given which isn't included or extended by entry
    const dependencies = getDependencies(source);
    if (changed && source != changed && !dependencies.includes(changed)) return;

    const subdir = path.dirname(pathDiff(globParent(pattern), entry));

    const name = path.basename(source, path.extname(pattern));

    const filename = path.basename(rules[pattern])
      .replace(/\$\{name\}/g, name)
      .replace(/\$\{version\}/g, config.project.version);

    // assemble the destination path and filename
    const destination = path.join(
      process.cwd(),
      config.paths.roots.to, 
      path.dirname(rules[pattern]),
      filename
    ).replace(/\$\{dir\}/g, subdir);

    // think the thought
    thinker.thoughts.push(
      build(thoughtify({ source, destination, name: camelize(name), changed, dependencies }))
    );
  });
  
  return thinker;
}