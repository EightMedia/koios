const paths = {
  SRC: {
    styles: "src/styles/",
    scripts: "src/scripts/",
    templates: "src/templates/",
  },

  DST: {
    base: "dst/",
    styles: "dst/assets/css/",
    scripts: "dst/assets/js/",
    templates: "dst/"
  }
};

paths.locals = {
  CSS_URL: "/assets/css/",
  JS_URL: "/assets/js/",
  IMG_URL: "/img/",
  VERSION: process.env.npm_package_version
};

module.exports = paths;
