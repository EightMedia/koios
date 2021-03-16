#!/usr/bin/env node

const { Signale } = require("signale");
const logger = new Signale({ scope: "koios", interactive: true });
const semver = require("semver");

const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const argv = yargs(hideBin(process.argv)).argv
const run = require("./run");

/**
 * Check if NodeJS version is at least 12.14.0
 */

if (!semver.satisfies(process.version, ">=12.14.0")) {
  logger.error(new Error("Koios needs NodeJS >=12.14.0 to function properly."));
  process.exit(0);
}

/**
 * Run tasks
 */

const verbose = argv.v || argv.verbose || false;

if (require.main === module) {
  delete require.cache[__filename];
  run({ tasks: argv._, verbose });
}
