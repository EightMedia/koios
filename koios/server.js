const { paths } = require(`${process.cwd()}/.koiosrc`);
const koios = require("./index").default;
const path = require("path");
const bs = require("browser-sync").create("localdev");
const proxyMiddleware = require("http-proxy-middleware");
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

    const apiProxy = proxyMiddleware("/.netlify/functions/*", {
      target: "http://localhost:9000/"
    });

    bs.init({
      server: {
        baseDir: paths.BLD.pages,
        directory: true,
        middleware: [apiProxy]
      },
      files: [paths.BLD.pages, paths.BLD.styles, paths.BLD.scripts],
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
      koios(tasks[ext], file).catch(err => {
        reject(err);
      });
    });
  });
}

exports.default = server;