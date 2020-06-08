const { paths } = require(`${process.cwd()}/.koiosrc`);
const KoiosThought = require("./utils/koios-thought");
const pathDiff = require("./utils/path-diff");

const fs = require("fs");
const path = require("path");
const mvdir = require("mvdir");

/**
 * Entry point for koios:
 * $ node koios resources
 */

exports.default = async function () {

  const promises = [];
  
  for (const entry in paths.resources) {
    const source = path.resolve(entry);
    const destination = path.resolve(paths.roots.to, paths.resources[entry]);
    const err = await mvdir(source, destination, { copy: true });
    const p = !err ? KoiosThought({}).done(pathDiff(process.cwd(), source)) : KoiosThought({}).error(err);
    promises.push(p);
  }

  return promises;
}