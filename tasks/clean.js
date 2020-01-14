const paths = require("./settings/paths");
const del = require("del");

exports.default = function cleam() {
  return del([
    paths.DST.styles + "*.css",
    paths.DST.scripts + "*.js",
    paths.DST.pages + "**/*.html",
    "!" + paths.DST.static + "**/*"
  ]);
}