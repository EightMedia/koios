const paths = require("./paths");
const chalk = require("chalk");

const fs = require("fs");
const mkdirp = require("mkdirp");
const path = require("path");

const glob = require("glob-all");
const pug = require("pug");

/**
 * Get file list in a Glob manner
 */

async function getFileList(globs) {
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

function buildPage(src) {
  return new Promise((resolve, reject) => {
    const filename = src.pop();
    const dir = paths.DST.templates + src.join(path.sep);

    mkdirp(dir, function(err) {
      if (err) reject(err);

      let dst = path.normalize(
        dir + path.sep + path.basename(filename, ".pug") + ".html"
      );

      render(
        paths.SRC.templates +
          "pages" +
          path.sep +
          src.join(path.sep) +
          path.sep +
          filename
      )
        .then(
          html =>
            `<!-- ${process.env.npm_package_name} v${process.env.npm_package_version} -->\n ${html}`
        )
        .then(html =>
          fs.writeFile(dst, html, err => {
            if (err) {
              reject(err);
              console.log(chalk.redBright(`> ${dst} (${err})`));
            } else {
              console.log(chalk.greenBright(`> ${dst}`));
              resolve(dst);
            }
          })
        )
        .catch(err => reject(err));
      });
  });
}

/**
 * Build
 */

function templates(files) {
  return new Promise(async (resolve, reject) => {
    const globs = [
      `${paths.SRC.templates}**${path.sep}*.pug`,
      `!${paths.SRC.templates}**${path.sep}_*.pug`
    ];

    if (files && !Array.isArray(files)) files = Array.of(files);
    else files = await getFileList(globs);

    if (files.length > 0) {
      let promises = [];
      files.forEach(src => {
        const a = paths.SRC.templates.split(path.sep);
        const b = src.split(path.sep);
        const d = a.filter(x => x != "" && !b.includes(x)).concat(b.filter(x => x != "" && !a.includes(x)));
        const type = d.shift();

        if (type == "pages") {
          promises.push(buildPage(d));
        } else if (type == "components") {
          // promises.push(buildComponent(d));
          console.log(chalk.magenta(`Build component ${d}`));
        }
      });

      Promise.all(promises).then(function(done) {
        resolve(done);
      }).catch(err => reject(err));
    } else {
      console.warn(chalk.yellow(`No templates to render`));
      resolve(); // finish task nicely
    }
  });
}

exports.default = templates;
