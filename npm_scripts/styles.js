const paths = require("./paths");
const chalk = require("chalk");

const fs = require('fs');
const mkdirp = require("mkdirp");
const path = require("path");

const sass = require("node-sass");
const pp = require("preprocess");
const postcss = require("postcss");
const autoprefixer = require("autoprefixer");
const cssnano = require("cssnano");

function styles() {
  const filename = "theme"; // TEMP STATIC SOLUTION

  const src = path.resolve(
    __dirname,
    "../" + paths.SRC.styles + filename + ".scss"
  );
  const dst = path.resolve(
    __dirname,
    "../" +
      paths.DST.styles +
      filename +
      ".v" +
      process.env.npm_package_version +
      ".css"
  );

  // read scss source
  var css = fs.readFileSync(src, { encoding: "UTF8" });

  // run node-sass
  var result = sass.renderSync({
    data: css,
    outputStyle: "expanded",
    includePaths: [paths.SRC.styles]
  });

  css = result.css;

  // run preprocess
  css = pp.preprocess(css, paths.locals, { type: "css" });

  // run postcss
  postcss([
    autoprefixer({
      cascade: false
    }),
    cssnano({
      zindex: false,
      discardComments: {
        removeAll: true
      },
      discardDuplicates: true,
      discardEmpty: true,
      minifyFontValues: true,
      minifySelectors: true
    })
  ])
    .process(css, { from: undefined })
    .then(result => {
      result.warnings().forEach(warn => {
        console.warn("    " + chalk.yellow(warn.toString()));
      });
      css = result.css;
    });

  // add banner
  css =
    "/* " +
    process.env.npm_package_name +
    " " +
    process.env.npm_package_version +
    " */ " +
    css;

  // make destination directory if it doesn't exist
  mkdirp(path.dirname(dst), function(err) {
    if (err) throw err;
  });

  // write destination file
  fs.writeFile(dst, css, function(err) {
    if (err) throw err;
    console.log(chalk.blueBright(dst));
  });

  return new Promise((resolve, reject) => {
    return resolve();
  });
}

exports.default = styles;