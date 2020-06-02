const { ENV, paths } = require(`${process.cwd()}/.koiosrc`);
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
          return `cleaned ${paths.roots.to}`;
        })
        .then(async (msg) => {
          return await fs.promises
            .symlink(
              path.resolve(paths.static),
              path.resolve(paths.roots.to, paths.static),
              "dir"
            )
            .then(() => {
              return KoiosThought({}).done(msg + ` and added the symlink to ${paths.static}`);
            });
        })
        .then((koios) => resolve(koios))
        .catch(err => reject(err));
    })
  ];
}