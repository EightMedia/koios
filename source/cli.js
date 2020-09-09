#!/usr/bin/env node

const { Signale } = require("signale");
const logger = new Signale({ interactive: true });
const semver = require("semver");
const run = require("./run");

/**
 * Check if NodeJS version is at least 12.14.0
 */

if (!semver.satisfies(process.version, ">=12.14.0")) {
  logger.error(new Error("Koios needs NodeJS >=12.14.0 to function properly."));
  process.exit(0);
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
