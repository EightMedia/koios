const paths = require("./paths");
const chalk = require("chalk");

const del = require("del");

(async () => {
	const deleted = await del([
    paths.DST.styles + "*.css",
    paths.DST.scripts + "*.js"
  ]);
	console.log("  Deleted:\n", "    " + chalk.blueBright(deleted.join("\n    ")));
})();