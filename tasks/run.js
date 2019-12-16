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

  const obj = {
    d: d,
    h: h,
    m: m,
    s: s,
    ms: ms
  };

  let str = "";
  if (obj.d > 0) str += obj.d + "d ";
  if (obj.h > 0) str += obj.h + "h ";
  if (obj.m > 0) str += obj.m + "m ";
  if (obj.s > 0) str += obj.s + "s ";
  if (obj.ms > 0) str += obj.ms + "ms ";

  return str;
}

/**
 * Run a task
 */

function run(fn, options) {
  const task = typeof fn.default === "undefined" ? fn : fn.default;
  const start = new Date();
  
  console.info(
    `[${chalk.dim(format(start))}] Starting '${chalk.bold.yellowBright(task.name)}${
      options ? ` (${options})` : ""
    }'...`
  );

  return task(options).then(resolution => {
    const end = new Date();
    const time = convertMs(end.getTime() - start.getTime());
    console.info(
      `[${chalk.dim(format(end))}] Finished '${chalk.bold.greenBright(task.name)}${
        options ? ` (${options})` : ""
      }' after ${time}`
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