const paths = {
  SRC: {
    styles: "src/styles/",
    scripts: "src/scripts/",
    pages: "src/templates/pages/",
    components: "src/templates/components/"
  },

  DST: {
    base: "dst/",
    styles: "dst/assets/css/",
    scripts: "dst/assets/js/",
    pages: "dst/"
  }
};

paths.locals = {
  CSS_URL: "/assets/css/",
  JS_URL: "/assets/js/",
  IMG_URL: "/img/",
  VERSION: process.env.npm_package_version
};

module.exports = paths;
