const { package, paths } = require(`${process.cwd()}/.koiosrc`);
const Thought = require("./thought");
const getChildren = require("./get-children");
const pathDiff = require("./path-diff");
const path = require("path");
const globby = require("globby");
const micromatch = require("micromatch");
const globParent = require("glob-parent");

/**
 * Think thoughts
 */

module.exports = async function ({ changed, build, rules, before, after }) {
  changed = changed ? path.resolve(process.cwd(), changed) : null;
  
  if (typeof before === "function") await before();

  const thinker = { thoughts: [], after };
  const patterns = Object.keys(rules);
  const entries = await globby(patterns, { cwd: path.resolve(paths.roots.from) });

  entries.forEach(entry => {
    const source = path.join(process.cwd(), paths.roots.from, entry);

    // find the glob pattern that matches this source
    const pattern = patterns.find((pattern) => micromatch.isMatch(entry, pattern));
    
    // skip this entry if a changed file is given which isn't included or extended by entry
    const children = getChildren(source);
    if (changed && source != changed && !children.includes(changed)) return;

    const subdir = path.dirname(pathDiff(globParent(pattern), entry));

    const filename = path.basename(rules[pattern])
      .replace(/\$\{name\}/g, path.basename(source, path.extname(pattern)))
      .replace(/\$\{version\}/g, package.version);

    // assemble the destination path and filename
    const destination = path.join(
      process.cwd(),
      paths.roots.to, 
      path.dirname(rules[pattern]),
      filename
    ).replace(/\$\{dir\}/g, subdir);

    // think the thought
    thinker.thoughts.push(
      build(Thought({ source, destination, changed, children }))
    );
  });
  
  return thinker;
}