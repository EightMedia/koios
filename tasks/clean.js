const paths = require("./settings/paths");
const del = require("del");

exports.default = async function () {
  return [new Promise(async (resolve, reject) => {
    const glob = [
      paths.DST.styles + "*.css",
      paths.DST.scripts + "*.js",
      paths.DST.pages + "**/*.html",
      "!" + paths.DST.static + "**/*"
    ];
    const result = await del(glob);

    return resolve({ log: `removed ${result.length} styles, scripts and templates` });
  })];
}