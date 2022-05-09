import config from "../config.js";
import run from "../run.js";
import path from "path";
import chokidar from "chokidar";
import liveServer from "live-server";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import fs from "node:fs";

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

    liveServer.start({
      port: 8000,
      root: config.paths.roots.to,
      logLevel: 0,
      open: false,
      ignore: "koios",
      httpsModule: "spdy",
      https: {
        key: fs.readFileSync(config.https.key),
        cert: fs.readFileSync(config.https.cert),
      },
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
