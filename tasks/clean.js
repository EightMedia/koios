const paths = require("./settings/paths");
const del = require("del");

exports.default = async function clean() {
  const promises = await del([
      paths.DST.styles + "*.css",
      paths.DST.scripts + "*.js",
      paths.DST.pages + "**/*.html",
      "!" + paths.DST.static + "**/*"
    ]);
  return Promise.resolve(promises);
}