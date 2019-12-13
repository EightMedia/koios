const paths = require("./paths");
const chalk = require("chalk");

const fs = require("fs");
const mkdirp = require("mkdirp");
const path = require("path");

const glob = require("glob-all");
const pug = require("pug");
const pugdoc = require("pug-doc");
const discodip = require("discodip");

/**
 * Get difference between paths
 */

function pathDiff(a, b) {
  a = a.split(path.sep);
  b = b.split(path.sep);

  return a
    .filter((x, i) => i > b.length || (b[i] != x && x != ""))
    .concat(b.filter((x, i) => i > a.length || (a[i] != x && x != "")))
    .join(path.sep);
}

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
    const dir = path.normalize(paths.DST.pages + path.dirname(pathDiff(paths.SRC.pages, src)));
    const dst = dir + path.sep + path.basename(src, ".pug") + ".html";

    mkdirp.sync(dir);

    render(src)
      .then(
        html =>
          `<!-- ${process.env.npm_package_name} v${process.env.npm_package_version} -->\n ${html}`
      )
      .then(html =>
        fs.writeFile(dst, html, err => {
          if (err) reject(err);
          resolve(dst);
        })
      )
      .catch(err => err);
  }).catch(err => err);
}

/**
 * Build templates
 */

function templates(changed) {
  return new Promise(async (resolve, reject) => {
    const globs = [
      `${paths.SRC.templates}**${path.sep}*.pug`,
      `!${paths.SRC.templates}**${path.sep}_*.pug`
    ];
    const fileList = changed ? Array.of(changed) : await getFileList(globs);

    if (fileList.length > 0) {
      let buildPromises = [];
      
      fileList.map(src => {
        // check if src is inside "components" or "pages"
        const type = pathDiff(paths.SRC.templates, src).split(path.sep).shift();
        
        // check type and build accordingly
        if (type === "pages") buildPromises.push(buildPage(src));
      });

      // resolve entire build when all build promises are done
      Promise.all(buildPromises).then(function(done) {
        console.log("> " + done.join("\n> "));
        resolve(done);
      }).catch(err => reject(err));
    } else {
      reject(new Error(`No templates inside ${paths.SRC.pages}`));
    }
  });
}

exports.default = templates;
