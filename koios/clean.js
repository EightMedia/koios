const { paths } = require(`${process.cwd()}/.koiosrc`);
const del = require("del");

const fs = require("fs");
const path = require("path");



/**
 * Entry point for run.js
 * $ node tasks/run clean
 */

exports.default = async function () {
  return [
    new Promise(async (resolve, reject) => {
      del(`${paths.DST.root}**/*`)
        .then((result) => { 
          return { log: `deleted everything inside ${paths.DST.root} (${result.length} items)` };
        })
        .then(async (obj) => {
          return await fs.promises
            .symlink(
              path.resolve(paths.static),
              path.resolve(paths.DST.root, paths.static),
              "dir"
            )
            .then(() => {
              obj.log += ` and added the symlink to ${paths.static} inside ${paths.DST.root}`;
              return obj;
            });
        })
        .then((obj) => resolve(obj))
        .catch(err => reject(err));
    })
  ];
}