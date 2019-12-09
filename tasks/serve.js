const paths = require("./paths");

const bs = require("browser-sync").create();

/**
 * Run server
 */

function serve() {
  return new Promise(function (resolve, reject) {
    bs.init({
      server: {
        baseDir: paths.DST.base,
        directory: true
      },
      files: [paths.DST.styles, paths.DST.scripts],
      notify: false,
      port: 8000,
      open: false
    });

    bs.watch(`${paths.DST}/*.html`, bs.reload);
  });
}

exports.default = serve;
