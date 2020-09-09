const pugDependencies = require("pug-dependencies");
const depTree = require("dependency-tree");
const path = require("path");

const getChildren = {
  pug: (source) => pugDependencies(source),
  scss: (source) => depTree.toList({ filename: source, directory: path.dirname(source) }),
  js: (source) => depTree.toList({ filename: source, directory: path.dirname(source), filter: path => path.indexOf("node_modules") === -1  }),
}

module.exports = function(source) {
  const ext = path.extname(source).substr(1);
  return getChildren[ext](source);
}