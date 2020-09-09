const pugDependencies = require("pug-dependencies");
const paperwork = require("precinct").paperwork;
const path = require("path");

const getChildren = {
  pug: (source) => pugDependencies(source),
  scss: (source) => paperwork(source)
    .map(child => path.resolve(path.dirname(source), child) + ".scss"),
    js: (source) => paperwork(source)
    .filter(child => child[0] === ".")
    .map(child => {
      const ext = path.extname(child);
      if (!ext) child += ".js";
      return path.resolve(path.dirname(source), child);
    }),
}

module.exports = function(source) {
  const ext = path.extname(source).substr(1);
  const c = getChildren[ext](source);
  console.log(c);
  return c;
}