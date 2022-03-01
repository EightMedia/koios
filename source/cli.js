#!/usr/bin/env node

import Signale from "signale/signale.js";
const logger = new Signale({ scope: "koios", interactive: true });

import semver from "semver";

import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import run from "./run.js";

const argv = yargs(hideBin(process.argv)).argv

/**
 * Check NodeJS version
 */

if (!semver.satisfies(process.version, ">=16.13.2")) {
  logger.error(new Error("Koios needs NodeJS >=16.13.2 to function properly."));
  process.exit(0);
}

/**
 * Run tasks
 */

const verbose = argv.v || argv.verbose || false;
const file = argv.f || argv.file || undefined;

run({ tasks: argv._, verbose, file });
