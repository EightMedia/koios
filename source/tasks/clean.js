const { paths } = require(`${process.cwd()}/.koiosrc`);
const thoughtify = require("../utils/thoughtify");
const del = require("del");

const fs = require("fs");
const path = require("path");

/**
 * Entry point
 */

module.exports = async function () {
  return {
    before: null,
    thoughts: [
      new Promise(async (resolve, reject) => {
        del(`${paths.roots.to}**/*`)
          .then((result) => {
            return `removed ${result.length} files from ${paths.roots.to}`;
          })
          .then(msg => thoughtify({}).done(msg))
          .then(thought => resolve(thought))
          .catch(err => reject(err));
      })
    ],
    after: null
  };
}