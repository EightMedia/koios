const paths = require("./paths");
const chalk = require("chalk");

const fs = require("fs");
const mkdirp = require("mkdirp");
const path = require("path");

const glob = require("glob-all");
const pug = require("pug");
const emitty = require("@emitty/core").configure();

emitty.language({
  extensions: [".pug"],
  parser: require("@emitty/language-pug").parse
});

/**
 * Build
 */

function components(files) {
  return new Promise(async (resolve, reject) => {
    
  });
}

exports.default = components;
