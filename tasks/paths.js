const paths = {
  SRC: {
    styles: "src/styles/",
    scripts: "src/scripts/",
    templates: "src/templates/pages/"
  },

  DST: {
    base: "dst/",
    styles: "dst/css/",
    scripts: "dst/js/",
    templates: "dst/"
  }
};

paths.locals = {
  CSS_URL: "/css/",
  JS_URL: "/js/",
  IMG_URL: "/img/",
  VERSION: process.env.npm_package_version
};

module.exports = paths;
