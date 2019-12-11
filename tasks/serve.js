const paths = require("./paths");

const bs = require("browser-sync").create("localdev");

/**
 * Run server
 */

function serve() {
  return new Promise(function (resolve, reject) {
    // bs.watch("*.html").on("change", bs.reload);

    bs.init({
      server: {
        baseDir: paths.DST.base,
        directory: true
      },
      files: [paths.DST.base, paths.DST.styles, paths.DST.scripts],
      notify: false,
      port: 8000,
      open: false
    });
  });
}

exports.default = serve;
