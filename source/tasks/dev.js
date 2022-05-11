import config from "../config.js";
import run from "../run.js";
import path from "path";
import chokidar from "chokidar";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import browserSync from "browser-sync";

// Patch BrowserSync to start a SecureServer
import http2 from "http2";
http2.createServer = http2.createSecureServer;

// Get command line arguments
const argv = yargs(hideBin(process.argv)).argv;
const verbose = argv.v || argv.verbose || false;

/**
 * Entry point
 */

export default function () {
  return new Promise(function (resolve, reject) {
    const chokidarOptions = {
      awaitWriteFinish: {
        stabilityThreshold: 500,
        pollInterval: 100,
      },
    };

    /**
     * Run Local Server
     */

    const bs = browserSync.create("localdev");
    bs.init({
      httpModule: "http2",
      https: true,
      server: {
        baseDir: config.paths.roots.to,
        directory: true,
      },
      files: [
        path.join(config.paths.roots.to, "**/*.css"),
        path.join(config.paths.roots.to, "**/*.js"),
        path.join(config.paths.roots.to, "**/*.html"),
      ],
      watchOptions: chokidarOptions,
      notify: false,
      port: 8000,
      open: false,
    });

    /**
     * Watch changes inside SRC and run tasks accordingly
     */

    const watcher = chokidar.watch(
      [
        `${config.paths.roots.from}/**/*.scss`,
        `${config.paths.roots.from}/**/*.js`,
        `${config.paths.roots.from}/**/*.pug`,
      ],
      chokidarOptions
    );

    watcher.on("change", function (file) {
      const tasks = {
        scss: "styles",
        js: "scripts",
        pug: ["parts", "pages"],
      };

      const ext = path.extname(file).substr(1);

      run({ tasks: tasks[ext], file, verbose }).catch((err) => {
        reject(err);
      });
    });
  });
}
