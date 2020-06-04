const { ENV, paths, robotsTxt } = require(`${process.cwd()}/.koiosrc`);
const KoiosThought = require("./utils/koios-thought");
const del = require("del");

const fs = require("fs");
const path = require("path");



/**
 * Entry point for koios:
 * $ node koios clean
 */

exports.default = async function () {
  return [
    new Promise(async (resolve, reject) => {
      del(`${paths.roots.to}**/*`)
        .then((result) => {
          return `removed ${result.length} files from ${paths.roots.to}`;
        })
        .then(async (msg) => {
          for (const target in paths.symlinks) {
            await fs.promises.symlink(
              path.resolve(target),
              path.resolve(paths.roots.to, paths.symlinks[target]),
              "dir"
            );
          }
          
          return msg + `, added symlinks`;
        })
        .then(async (msg) => {
          await fs.promises.writeFile(path.join(paths.roots.to, "robots.txt"), robotsTxt);
          return msg + ` and robots.txt`;
        })
        .then((msg) => KoiosThought({}).done(msg))
        .then((koios) => resolve(koios))
        .catch(err => reject(err));
    })
  ];
}