const { paths } = require(`${process.cwd()}/.koiosrc`);
const run = require("../run");
const path = require("path");
const bs = require("browser-sync").create("localdev");
const chokidar = require("chokidar");

const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const argv = yargs(hideBin(process.argv)).argv

const verbose = argv.v || argv.verbose || false;


/**
 * Entry point
 */

module.exports = function () {
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
        baseDir: paths.roots.to,
        directory: true,
      },
      files: [
        path.join(paths.roots.to, "**/*.css"),
        path.join(paths.roots.to, "**/*.js"),
        path.join(paths.roots.to, "**/*.html"),
      ],
      watchOptions: chokidarOptions,
      notify: false,
      port: 8000,
      open: false
    });

    /**
     * Watch changes inside SRC and run tasks accordingly
     */

    const watcher = chokidar.watch(
      [
        `${paths.roots.from}/**/*.scss`,
        `${paths.roots.from}/**/*.js`,
        `${paths.roots.from}/**/*.pug`
      ],
      chokidarOptions
    );

    watcher.on("change", function(file) {
      const tasks = {
        scss: "styles",
        js: "scripts",
        pug: ["parts", "pages"]
      };

      const ext = path.extname(file).substr(1);

      run({ tasks: tasks[ext], file, verbose }).catch(err => {
        reject(err);
      });
    });
  });
}
