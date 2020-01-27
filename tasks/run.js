const { Signale } = require("signale");
const logger = new Signale();
const promiseProgress = require("./utils/promise-progress");
const pathDiff = require("./utils/path-diff");
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

function run(fn, input) {
  const task = typeof fn.default === "undefined" ? fn : fn.default;
  const start = new Date();

  const log = logger.scope(task.name);
  log.pending(`Started at ${format(start)} for`, input || `${task.name}`);

  return task(input).then(promises => {
    return promiseProgress(promises, (i, item) => {
      if (item instanceof Error) throw item;
      if (!item.log && !item.err && !item.source && !item.destination) throw new Error("Task returned an invalid object.");

      if (item.err) {
        item.err.message = `[${i}/${promises.length}] ${pathDiff(process.cwd(), item.source)} → ${item.err.message}`;
        log.error(item.err);
      } else {
        item.log = item.log || (item.destination ? pathDiff(process.cwd(), item.destination) : pathDiff(process.cwd(), item.source));
        if (typeof item.log === "string") item.log = { type: "success", msg: item.log };
        log[item.log.type](`[${i}/${promises.length}] ${item.log.msg}`);

        if (item.log.verbose) {
          const sublog = log.scope(task.name, item.log.scope);
          item.log.verbose.forEach((issue, i) => sublog.note(`[${i+1}/${item.log.verbose.length}] ${issue}`));
        }
      }
    })
    .then(result => {
      let errors = result.filter(item => item.err);
      
      if (errors.length > 0) {
        logger.warn(`Reported ${errors.length} error${errors.length !== 1 ? "s" : ""}`);
      }
    })
    .catch(err => logger.error(err))
    .finally(() => {
      const end = new Date();
      const time = convertMs(end.getTime() - start.getTime());
      log.complete(`Finished after ${time}`);
    });
  });
}

/**
 * Read which module(s) to run from the 2nd terminal argument
 */

if (require.main === module && process.argv.length > 2) {
  delete require.cache[__filename];

  const tasks = process.argv.slice(2);

  if (tasks.length > 1) {
    tasks.unshift(async () => logger.time("Taskrunner"));
    tasks.push(async () => logger.timeEnd("Taskrunner"));
  }
  
  tasks.reduce(async (previousPromise, nextTask) => {
    await previousPromise;
    
    console.log(""); // insert blank line for clarity

    if (typeof nextTask === "function") return Promise.resolve(nextTask());
    
    const module = require(`./${nextTask}.js`).default;
    return run(module).catch(err => {
      logger.error(err);
      process.exit(1);
    });
  }, Promise.resolve());
}

exports.default = run;