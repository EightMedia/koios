const { paths } = require(`${process.cwd()}/.koiosrc`);
const pathDiff = require("./utils/path-diff");
const fs = require("fs");
const path = require("path");
const del = require("del");
const globby = require("globby");

/**
 * Copy source to destination
 */

function copy(source, destination) {
  return new Promise((resolve, reject) => {
    fs.promises.mkdir(path.dirname(destination), { recursive: true })
      .then(() => fs.promises.copyFile(source, destination))
      .then(() => resolve({ log: pathDiff(process.cwd(), destination) }))
      .catch(err => reject(err));
  });
}

/**
 * Entry point for run.js
 * $ node tasks/run export
 */

exports.default = async function () {
  await del(`${paths.EXP.root}**/*`);
  
  const entries = await globby(`${paths.BLD.root}**/*`);
  const promises = [];

  entries.forEach(entry => {
    const source = path.resolve(entry);
    const destination = path.resolve(paths.EXP.root, pathDiff(paths.BLD.root, entry));
    promises.push(copy(source, destination));
  });
  
  return promises;
}