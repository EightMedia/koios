const S = require("path").sep;

const paths = {
  SRC: { root: `source${S}` },
  DST: { root: `build${S}` },
  EXP: { root: `export${S}` }
};

// Source paths
paths.SRC.styles = `${paths.SRC.root}styles${S}`;
paths.SRC.scripts = `${paths.SRC.root}scripts${S}`;
paths.SRC.data = `${paths.SRC.root}data${S}`;

paths.SRC.templates = `${paths.SRC.root}templates${S}`;
paths.SRC.pages = `${paths.SRC.templates}pages${S}`;
paths.SRC.components = `${paths.SRC.templates}components${S}`;

// Destination paths
paths.DST.assets = `${paths.DST.root}assets${S}`;
paths.DST.styles = `${paths.DST.assets}css${S}`;
paths.DST.scripts = `${paths.DST.assets}js${S}`;

paths.DST.pages = `${paths.DST.root}`;
paths.DST.components = `${paths.DST.root}components${S}`;
paths.DST.icons = paths.DST.components;

// Static items
paths.DST.static = `${paths.DST.root}static${S}`;

paths.locals = {
  CSS_URL: "/assets/css/",
  JS_URL: "/assets/js/",
  IMG_URL: "/static/images/",
  FONTS_URL: "/static/fonts/",
  VIDEOS_URL: "/static/video/",
  TEMPLATES_PATH: paths.SRC.templates
};

module.exports = paths;
