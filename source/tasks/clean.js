const { paths } = require(`${process.cwd()}/.koiosrc`);
const Thought = require("../utils/thought");
const del = require("del");

const fs = require("fs");
const path = require("path");



/**
 * Entry point for koios:
 * $ node koios clean
 */

exports.default = async function () {
  return {
    before: null,
    promises: [
      new Promise(async (resolve, reject) => {
        del(`${paths.roots.to}**/*`)
          .then((result) => {
            return `removed ${result.length} files from ${paths.roots.to}`;
          })
          .then((msg) => Thought({}).done(msg))
          .then((koios) => resolve(koios))
          .catch(err => reject(err));
      })
    ],
    after: null
  };
}