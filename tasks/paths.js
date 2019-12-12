const S = require("path").sep;

const paths = {
  SRC: { root: `src${S}` },
  DST: { root: `dst${S}` }
};

// Source paths
paths.SRC.styles = `${paths.SRC.root}styles${S}`;
paths.SRC.scripts = `${paths.SRC.root}scripts${S}`;

paths.SRC.templates = `${paths.SRC.root}templates${S}`;
paths.SRC.components = `${paths.SRC.templates}components${S}`;
paths.SRC.pages = `${paths.SRC.templates}pages${S}`;

// Destination paths
paths.DST.assets = `${paths.DST.root}assets${S}`;
paths.DST.styles = `${paths.DST.assets}css${S}`;
paths.DST.scripts = `${paths.DST.assets}js${S}`;

paths.DST.components = `${paths.DST.root}components${S}`;
paths.DST.pages = `${paths.DST.root}`;

paths.locals = {
  CSS_URL: "/assets/css/",
  JS_URL: "/assets/js/",
  IMG_URL: "/img/",
  VERSION: process.env.npm_package_version
};

module.exports = paths;
