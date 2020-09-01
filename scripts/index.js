#!/usr/bin/env node

const { paths } = require(`${process.cwd()}/.koiosrc`);
const { Signale } = require("signale");
const logger = new Signale({ interactive: true });
const promiseProgress = require("./utils/promise-progress");
const pathDiff = require("./utils/path-diff");
const semver = require("semver");
const fs = require("fs");

/**
 * Check if NodeJS version is at least 12.14.0
 */

if (!semver.satisfies(process.version, ">=12.14.0")) {
  logger.error(new Error("Koios needs NodeJS >=12.14.0 to function properly."));
  process.exit(0);
}

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

const availableTasks = ["bump", "clean", "resources", "scripts", "server", "styles", "symlinks", "templates"]

async function run(task, input) {
  if (!availableTasks.includes(task)) {
    throw Error("Use one of the following tasks: " + availableTasks.join(", "));
  }

  const fn = require(`./${task}.js`).default;
  const start = new Date();

  const log = logger.scope(task);
  log.pending(`Started at ${format(start)} for`, input || `${task}`);

  await fs.promises.mkdir(paths.roots.to).catch((err) => err);

  return fn(input).then(async koios => {
    if (typeof koios.before === "function") await koios.before();

    return promiseProgress(koios.promises)((i, item) => {
      log[item.log.type]({ 
        prefix: `[${(i).toString().padStart(2, "0")}/${koios.promises.length.toString().padStart(2, "0")}]`, 
        message: item.log.msg
      });

      if (item.log.sub) {
        const sublog = new Signale({ scope: [task, item.log.scope] });
        item.log.sub.forEach((issue, i) => sublog.note({ 
          prefix: `[${(i+1).toString().padStart(2, "0")}/${item.log.sub.length.toString().padStart(2, "0")}]`, 
          message: issue
        }));
      }
    })
    .then(result => {
      const errors = result.filter(item => item.hasError());
      
      if (errors.length > 0) {
        log.warn(`Reported ${errors.length} error${errors.length !== 1 ? "s" : ""}`);
      }
    })
    .finally(async () => {
      if (typeof koios.after === "function") await koios.after();

      const end = new Date();
      const time = convertMs(end.getTime() - start.getTime());
      log.complete(`finished in ${time}`);
    });
  });
}

/**
 * Read which module(s) to run from the 2nd terminal argument
 */

if (require.main === module && process.argv.length > 2) {
  delete require.cache[__filename];

  const tasks = process.argv.slice(2);
  const command = process.env.npm_config_argv ? JSON.parse(process.env.npm_config_argv).original.pop() : "koios";

  if (tasks.length > 1) {
    tasks.unshift(async () => logger.time(command));
    tasks.push(async () => logger.timeEnd(command));
  }
  
  // run tasks one after another
  tasks.reduce(async (previousTask, nextTask) => {
    await previousTask;
    
    console.log(""); // insert blank line for clarity

    if (typeof nextTask === "function") return nextTask();
    
    return run(nextTask).catch(err => {
      logger.error(err);
      process.exit(0);
    });
  }, Promise.resolve());
}

exports.default = run;