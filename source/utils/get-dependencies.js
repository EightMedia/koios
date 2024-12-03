import pugDependencies from "@hylmar/pug-dependencies";
import dependencyTree from "dependency-tree";
import path from "path";

const getDependencies = {
  pug: (source) =>
    pugDependencies(source, { basedir: process.cwd() }).map(
      (child) => (child += ".pug")
    ),
  scss: (source) =>
    dependencyTree.toList({
      filename: source,
      directory: path.dirname(source),
    }),
  js: (source) =>
    dependencyTree.toList({
      filename: source,
      directory: path.dirname(source),
      filter: (path) => path.indexOf("node_modules") === -1,
    }),
};

export default function (source) {
  const ext = path.extname(source).substr(1);
  return getDependencies[ext](source);
}
