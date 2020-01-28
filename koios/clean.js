const paths = require("./settings/paths");
const del = require("del");

/**
 * Entry point for run.js
 * $ node tasks/run clean
 */

exports.default = async function () {
  return [new Promise(async (resolve, reject) => {
    const glob = [
      paths.DST.styles + "*.css",
      paths.DST.scripts + "*.js",
      paths.DST.scripts + "*.LICENCE",
      paths.DST.scripts + "*.map",
      paths.DST.pages + "**/*.html",
      "!" + paths.DST.static + "**/*"
    ];
    const result = await del(glob);

    return resolve({ log: `removed ${result.length} styles, scripts and templates` });
  })];
}