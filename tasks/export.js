const paths = require("./settings/paths");

const qoa = require("qoa");
const bumper = require("bump-regex");
const fs = require("fs");

exports.default = async function export() {
  return [new Promise(async (resolve, reject) => {
    return resolve({ log: `TODO: export` });
  })];
}