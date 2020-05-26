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
      del(`${paths[ENV].root}**/*`)
        .then((result) => { 
          return `deleted everything inside ${paths[ENV].root} (${result.length} items)`;
        })
        .then(async (msg) => {
          return await fs.promises
            .symlink(
              path.resolve(paths.static),
              path.resolve(paths[ENV].root, paths.static),
              "dir"
            )
            .then(() => {
              return KoiosThought({}).done(msg + ` and added the symlink to ${paths.static} inside ${paths[ENV].root}`);
            });
        })
        .then((koios) => resolve(koios))
        .catch(err => reject(err));
    })
  ];
}