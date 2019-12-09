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

function readAll(globs) {
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
 * Build
 */

function templates() {
  return new Promise((resolve, reject) => {
    const src = [
      path.resolve(__dirname, `../${paths.SRC.templates}**/*.pug`),
      "!" + path.resolve(__dirname, `../${paths.SRC.templates}**/_*.pug`)
    ];
    const dst = path.resolve(__dirname, `../${paths.DST.templates}`);

    // make sure the destination exists
    mkdirp(path.dirname(dst), function(err) {
      if (err) reject(err);
    });

    readAll(src)
      .then(files => {
        if (files.length > 0) {
          files.forEach(file => {
            var dstFile = dst + "/" + path.basename(file, ".pug") + ".html";

            render(file)
              .then(html => "<!-- " + process.env.npm_package_name + " v" + process.env.npm_package_version + " -->\n" + html)
              .then(html => fs.writeFile(dstFile, html, (err) => {
                if (err) reject(err); 
                console.log(chalk.blueBright(`${dstFile}`));
                resolve();
              }))
              .catch(err => reject(err));
          });
        } else {
          console.warn(chalk.yellow(`No templates to render`));
          resolve(); // finish task nicely
        }
      })
      .catch(err => reject(err));
  });
}

exports.default = templates;
