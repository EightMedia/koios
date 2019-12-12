const paths = require("./paths");

const bs = require("browser-sync").create("localdev");

/**
 * Run server
 */

function serve() {
  return new Promise(function (resolve, reject) {
    bs.init({
      server: {
        baseDir: paths.DST.pages,
        directory: true
      },
      files: [paths.DST.pages, paths.DST.styles, paths.DST.scripts],
      notify: false,
      port: 8000,
      open: false
    });
  });
}

exports.default = serve;
