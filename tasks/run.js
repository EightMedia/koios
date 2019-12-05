const chalk = require("chalk");

function format(time) {
  return time.toTimeString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, "$1");
}

function run(fn, options) {
  const task = typeof fn.default === "undefined" ? fn : fn.default;
  const start = new Date();
  console.info(
    `[${chalk.dim(format(start))}] Starting '${chalk.cyan(task.name)}${
      options ? ` (${options})` : ""
    }'...`
  );
  return task(options).then(resolution => {
    const end = new Date();
    const time = end.getTime() - start.getTime();
    console.info(
      `[${chalk.dim(format(end))}] Finished '${chalk.magenta(task.name)}${
        options ? ` (${options})` : ""
      }' after ${time} ms`
    );
    return resolution;
  });
}

if (require.main === module && process.argv.length > 2) {
  delete require.cache[__filename];

  const module = require(`./${process.argv[2]}.js`).default;

  run(module).catch(err => {
    console.error(err.stack);
    process.exit(1);
  });
}

exports.default = run;