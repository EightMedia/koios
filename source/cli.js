#!/usr/bin/env node

const { Signale } = require("signale");
const logger = new Signale({ scope: "koios", interactive: true });
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
  run(process.argv.slice(2));
}
