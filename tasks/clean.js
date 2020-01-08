const paths = require("./settings/paths");
const chalk = require("chalk");

const del = require("del");

async function clean() {
	const deleted = await del([
    paths.DST.styles + "*.css",
    paths.DST.scripts + "*.js",
    paths.DST.pages + "**/*.html",
    "!" + paths.DST.static + "**/*"
  ]);

  Promise.resolve(deleted);
};

exports.default = clean;