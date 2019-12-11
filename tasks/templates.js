const paths = require("./paths");
const chalk = require("chalk");

const fs = require("fs");
const mkdirp = require("mkdirp");
const path = require("path");

const glob = require("glob-all");
const pug = require("pug");

/**
 * Read multiple files in a Glob manner
 */

async function readAll(globs) {
  globs = [].concat(globs);

  return new Promise(function (resolve, reject) {
    glob(globs, function(err, files) {
      if (err) reject(err);
      resolve(files);
    });
  });
}

/**
 * Read file
 */

function read(file) {
  return new Promise(function (resolve, reject) {
    fs.readFile(file, (err, content) => err ? reject(err) : resolve(content.toString()));
  });
}

/**
 * Compile pug into html
 */

function render(src) {
  return new Promise(function (resolve, reject) {
    pug.renderFile(src, paths.locals, function(err, html) {
      if (err) reject(err);
      resolve(html);
    });
  });
};

/**
 * Process one file at a time
 */

function single(src, dst) {
  return new Promise((resolve, reject) => {
    render(src)
      .then(html => "<!-- " + process.env.npm_package_name + " v" + process.env.npm_package_version + " -->\n" + html)
      .then(html => fs.writeFile(dst, html, (err) => {
        if (err) {
          reject(err);
          console.log(chalk.redBright(`> ${dst} (${err})`))
        } else {
          console.log(chalk.greenBright(`> ${dst}`));
          resolve(dst);
        }
      }))
      .catch(err => reject(err));
  });
}

/**
 * Build
 */

function templates(files) {
  if (files) Array.from(files);

  return new Promise(async (resolve, reject) => {
    const globs = [
      path.resolve(__dirname, `../${paths.SRC.templates}**/*.pug`),
      "!" + path.resolve(__dirname, `../${paths.SRC.templates}**/_*.pug`)
    ];

    const src = files || await readAll(globs);
    const dst = path.resolve(__dirname, `../${paths.DST.templates}`);

    console.log(src);

    // make sure the destination exists
    mkdirp(path.dirname(dst), function(err) {
      if (err) reject(err);
    });
    
    if (src.length > 0) {
      let promises = [];
      src.forEach(file => {
        promises.push(single(file, dst + "/" + path.basename(file, ".pug") + ".html"));
      });
      
      Promise.all(promises).then(function(done) {
        resolve(done);
      });
    } else {
      console.warn(chalk.yellow(`No templates to render`));
      resolve(); // finish task nicely
    }
  });
}

exports.default = templates;
