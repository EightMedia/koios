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

/**
 * Build sass styles
 */

const buildStyles = function() {
  this.data;
  
  console.log(chalk.bold("  Build styles:"));

  this.build = (filename) => {
    const src = path.resolve(__dirname, "../" + paths.SRC.styles + filename + ".scss");
    const dst = path.resolve(
      __dirname,
      "../" +
        paths.DST.styles +
        filename +
        ".v" +
        process.env.npm_package_version +
        ".css"
    );
    this.read(src);
    this.compile();
    this.preprocess();
    this.postcss().then(done => {
      if (done) {
        this.banner();
        this.write(dst);
      } else {
        console.error("    " + chalk.red("Could not minify " + dst));
      }
    });
  };

  /**
   * Read input from scss file
   */

  this.read = src => {
    this.data = fs.readFileSync(src, { encoding: "UTF8" });
  };

  /**
   * Compile scss to css and set it to this.data
   */

  this.compile = () => {
    // render the result
    var result = sass.renderSync({
      data: this.data,
      outputStyle: "expanded",
      includePaths: [paths.SRC.styles]
    });

    this.data = result.css;
  };

  /**
   * Preprocess this.data
   */

  this.preprocess = () => {
    this.data = pp.preprocess(this.data, paths.locals, { type: "css" });
  }

  /**
   * Autoprefix and minify this.data
   */

  this.postcss = () => {
    return postcss([
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
    ]).process(this.data, { from: undefined })
      .then(result => {
        result.warnings().forEach(warn => {
          console.warn("    " + chalk.yellow(warn.toString()));
        });
        this.data = result.css;
        return true;
      });
  };

  /**
   * Add banner to this.data
   */

  this.banner = () => {
    this.data = "/* " + process.env.npm_package_name + " " + process.env.npm_package_version + " */ " + this.data;
  }

  /**
   * Write this.data to dst
   */

  this.write = (dst) => {
    // make destination directory if it doesn't exist
    mkdirp(path.dirname(dst), function(err) {
      if (err) throw err;
    });

    // write destination file
    fs.writeFile(dst, this.data, function(err) {
      if (err) throw err;
      console.log("    " + chalk.blueBright(dst));
    });
  };
};

const scss = new buildStyles();
scss.build("theme");