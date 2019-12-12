const paths = require("./paths");
const run = require("./run").default;

const path = require("path");
const chokidar = require("chokidar");

/**
 * Run server
 */

function watch() {
  const tasks = {
    scss: require(`./styles.js`).default,
    js: require(`./scripts.js`).default,
    pug: require(`./templates.js`).default
  };

  return new Promise(function (resolve, reject) {
    const watcher = chokidar.watch([
      paths.SRC.styles,
      paths.SRC.scripts,
      paths.SRC.templates
    ]);

    watcher.on("change", function(file) {
      const ext = path.extname(file).substr(1);
      run(tasks[ext], file).catch(err => {
        reject(err);
      });
    });
  })
}

exports.default = watch;
