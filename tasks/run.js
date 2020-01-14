const { Signale } = require("signale");
const logger = new Signale();
const promiseProgress = require("./utils/promise-progress");
const path = require("path");

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
  if (d > 0) str += `${d}d `;
  if (h > 0) str += `${h}h `;
  if (m > 0) str += `${m}m `;
  if (s > 0) str += `${Number.parseFloat(s + "." + ms).toFixed(2)}s`;
  else str += `${ms}ms`;

  return str;
}

/**
 * Run a task
 */

function run(fn, options) {
  const task = typeof fn.default === "undefined" ? fn : fn.default;
  const start = new Date();

  const log = logger.scope(task.name);
  log.pending(`Started at ${format(start)} for`, options || `all ${task.name}`);

  return task(options).then(promises => {
    return promiseProgress(promises, (i, item) => {
      if (item.err) {
        item.err.message = `[${i}/${promises.length}] ${item.src} → ${item.err.message}`;
        logger.error(item.err);
      } else if (item.warn) {
        const msg = `[${i}/${promises.length}] ${item.dst}`];
        item.warn.forEach(w => msg.push(w));
        logger.warn(msg);
      } else {
        logger.success(`[${i}/${promises.length}] ${item.dst}`);
      }
    })
    .then(result => {
      let errors = result.filter(item => item.err);

      if (errors.length > 0) {
        logger.warn(`Reported ${errors.length} error${errors.length !== 1 ? "s" : ""}`);
      }

      const end = new Date();
      const time = convertMs(end.getTime() - start.getTime());
      log.complete(`Finished after ${time}`);

      return;
    })
    .catch(err => reject(err));
  });
}

/**
 * Read which module to run from the 2nd terminal argument
 */

if (require.main === module && process.argv.length > 2) {
  delete require.cache[__filename];

  const module = require(`./${process.argv[2]}.js`).default;

  run(module).catch(err => {
    logger.error(err);
    process.exit(1);
  });
}

exports.default = run;