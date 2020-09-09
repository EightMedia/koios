const { paths } = require(`${process.cwd()}/.koiosrc`);
const run = require("../run");
const path = require("path");
const bs = require("browser-sync").create("localdev");
const { createProxyMiddleware } = require("http-proxy-middleware");
const chokidar = require("chokidar");

/**
 * Entry point for koios:
 * $ node koios dev
 */

exports.default = function () {
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

    const apiProxy = createProxyMiddleware("/.netlify/functions/*", {
      target: "http://localhost:9000/"
    });

    bs.init({
      server: {
        baseDir: paths.roots.to,
        directory: true,
        middleware: [apiProxy]
      },
      files: [
        path.join(paths.roots.to, paths.locals.CSS_URL, "*.css"),
        path.join(paths.roots.to, paths.locals.JS_URL, "*.js"),
        path.join(paths.roots.to, "*.html"),
      ],
      watchOptions: chokidarOptions,
      notify: false,
      port: 8000,
      open: false
    });

    /**
     * Watch changes inside SRC and run tasks accordingly
     */

    const tasks = {
      scss: (file) => {
        run("styles", file).catch(err => {
          reject(err);
        });
      },
      js: (file) => {
        run("scripts", file).catch(err => {
          reject(err);
        });
      },
      pug: (file) => {
        run("components", file).catch(err => {
          reject(err);
        });
        run("pages", file).catch(err => {
          reject(err);
        });
      }
    };

    const watcher = chokidar.watch(
      [
        `${paths.roots.from}/**/*.scss`,
        `${paths.roots.from}/**/*.js`,
        `${paths.roots.from}/**/*.pug`
      ],
      chokidarOptions
    );

    watcher.on("change", function(file) {
      const ext = path.extname(file).substr(1);
      tasks[ext](file);
    });
  });
}
