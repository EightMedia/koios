const { paths, robotsTxt } = require(`${process.cwd()}/.koiosrc`);
const Thought = require("../utils/thought");

const fs = require("fs");
const path = require("path");



/**
 * Entry point for koios:
 * $ node koios robots
 */

exports.default = async function () {
  return {
    before: null,
    promises: [
      new Promise(async (resolve, reject) => {
        fs.promises.writeFile(path.join(paths.roots.to, "robots.txt"), robotsTxt)
          .then(() => Thought({}).done(`added robots.txt to ${path.join(paths.roots.to, "robots.txt")}`))
          .then((koios) => resolve(koios))
          .catch(err => reject(err));
      })
    ],
    after: null
  };
}