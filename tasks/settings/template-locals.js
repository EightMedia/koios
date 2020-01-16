const S = require("path").sep;
const paths = require("./paths");

/**
 * The locals attribute for pug rendering
 * access through self.variable
 */

module.exports = Object.assign(
  {
    version: process.env.npm_package_version,
    imageSizes: require(`${process.cwd()}${S}${paths.SRC.data}image-sizes.json`),
    dataMeetUs: require(`${process.cwd()}${S}${paths.SRC.data}maak-kennis-items.json`),
  },
  require(`${process.cwd()}${S}${paths.SRC.data}template-locals.js`),
  paths.locals
);