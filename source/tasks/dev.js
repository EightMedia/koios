import config from "../config.js";
import run from "../run.js";
import path from "path";
import browserSync from "browser-sync";
import chokidar from "chokidar";
import yargs from "yargs";
import { globby } from "globby";
import { hideBin } from "yargs/helpers";

const bs = browserSync.create("localdev");
const argv = yargs(hideBin(process.argv)).argv;

const verbose = argv.v || argv.verbose || false;

/**
 * Entry point
 */

export default function () {
  return new Promise(async function (resolve, reject) {
    const chokidarOptions = {
      awaitWriteFinish: {
        stabilityThreshold: 500,
        pollInterval: 100,
      },
    };

    /**
     * Run BrowserSync
     */

    bs.init({
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
      await globby([
        `${config.paths.roots.from}/**/*.scss`,
        `${config.paths.roots.from}/**/*.js`,
        `${config.paths.roots.from}/**/*.pug`,
      ]),
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
