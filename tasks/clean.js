const paths = require("./paths");
const chalk = require("chalk");

const del = require("del");

async function clean() {
	const deleted = await del([
    paths.DST.styles + "*.css",
    paths.DST.scripts + "*.js",
    paths.DST.templates + "*.html"
  ]);

  console.log(chalk.blueBright(deleted.join("\n")));
};

exports.default = clean;