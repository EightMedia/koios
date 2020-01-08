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
    /**
     * Run BrowserSync
     */

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

    /**
     * Watch changes inside SRC and run tasks accordingly
     */

    const tasks = {
      scss: require(`./styles.js`).default,
      js: require(`./scripts.js`).default,
      pug: require(`./templates.js`).default
    };

    const watcher = chokidar.watch([
      `${paths.SRC.styles}**/*.scss`,
      `${paths.SRC.scripts}**/*.js`,
      `${paths.SRC.templates}**/*.pug`,
    ]);

    watcher.on("change", function(file) {
      const ext = path.extname(file).substr(1);
      run(tasks[ext], file).catch(err => {
        reject(err);
      });
    });
  });
}

exports.default = server;
