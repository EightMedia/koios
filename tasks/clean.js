const paths = require("./settings/paths");
const del = require("del");

exports.default = async function clean() {
  return [new Promise(async (resolve, reject) => {
    const result = await del([
      paths.DST.styles + "*.css",
      paths.DST.scripts + "*.js",
      paths.DST.pages + "**/*.html",
      "!" + paths.DST.static + "**/*"
    ]);

    return resolve({ log: `removed ${result.length} styles, scripts and templates` });
  })];
}