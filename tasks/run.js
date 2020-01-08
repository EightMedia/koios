const chalk = require("chalk");

/**
 * Format time string to 2 digits
 */

function format(time) {
  return time.toTimeString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, "$1");
}

/**
 * Convert milliseconds to string with days, hours, minutes and seconds
 */ 

function convertMs(ms) {
  let d, h, m, s;
  s = Math.floor(ms / 1000);
  ms = ms % 1000;
  m = Math.floor(s / 60);
  s = s % 60;
  h = Math.floor(m / 60);
  m = m % 60;
  d = Math.floor(h / 24);
  h = h % 24;

  let str = "";
  if (d > 0) str += `${d}s `;
  if (h > 0) str += `${h}s `;
  if (m > 0) str += `${m}s `;
  if (s > 0) str += `${s}.${ms}s`;
  else str += `${ms}ms`;

  return str;
}

/**
 * Run a task
 */

function run(fn, options) {
  const task = typeof fn.default === "undefined" ? fn : fn.default;
  const start = new Date();

  console.info(
    `[${chalk.dim(format(start))}] Running '${chalk.bold.blueBright(task.name)}${
      options ? ` (${options})` : ""
    }'...`
  );

  return task(options).then(resolution => {
    const end = new Date();
    const time = convertMs(end.getTime() - start.getTime());
    console.info(
      `[${chalk.dim(format(end))}] Finished '${chalk.bold.greenBright(
        task.name
      )}${options ? ` (${options})` : ""}' after ${time}`
    );
    return resolution;
  });
}

/**
 * Read which module to run from the 2nd terminal argument
 */

if (require.main === module && process.argv.length > 2) {
  delete require.cache[__filename];

  const module = require(`./${process.argv[2]}.js`).default;

  run(module).catch(err => {
    console.error(err.stack);
    process.exit(1);
  });
}

exports.default = run;