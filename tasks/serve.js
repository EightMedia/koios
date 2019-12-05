const paths = require("./paths");

const bs = require("browser-sync").create();

bs.init({
  server: {
    baseDir: paths.DST.base,
    directory: true
  },
  files: [
    paths.DST.styles,
    paths.DST.scripts
  ],
  notify: false,
  port: 8000,
  open: false
});

bs.reload(["*.html", "*.css", "*.js"]);
