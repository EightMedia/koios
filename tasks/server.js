const paths = require("./settings/paths");
const run = require("./run").default;

const path = require("path");
const bs = require("browser-sync").create("localdev");
const chokidar = require("chokidar");

/**
 * Run server and watch changes in SRC
 */

function server() {
  return new Promise(function(resolve, reject) {
    const chokidarOptions = {
      awaitWriteFinish: {
        stabilityThreshold: 500,
        pollInterval: 100
      }
    };

    /**
     * Run BrowserSync
     */

    bs.init({
      server: {
        baseDir: paths.DST.pages,
        directory: true
      },
      files: [paths.DST.pages, paths.DST.styles, paths.DST.scripts],
      watchOptions: chokidarOptions,
      notify: false,
      port: 8000,
      open: false
    });

    /**
     * Watch changes inside SRC and run tasks accordingly
     */

    const tasks = {
      scss: "styles",
      js: "scripts",
      pug: "templates"
    };

    const watcher = chokidar.watch(
      [
        `${paths.SRC.styles}**/*.scss`,
        `${paths.SRC.scripts}**/*.js`,
        `${paths.SRC.templates}**/*.pug`
      ],
      chokidarOptions
    );

    watcher.on("change", function(file) {
      const ext = path.extname(file).substr(1);
      run(tasks[ext], file).catch(err => {
        reject(err);
      });
    });
  });
}

exports.default = server;