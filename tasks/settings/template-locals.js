const paths = require("./paths");

/**
 * The locals attribute for pug rendering
 * access through self.variable
 */

module.exports = Object.assign(
  {
    version: process.env.npm_package_version,
    imageSizes: require(paths.SRC.data + "image-sizes.json"),
    dataMeetUs: require(paths.SRC.data + "maak-kennis-items.json"),
  },
  require(paths.SRC.data + "template-locals.js"),
  paths.locals
);