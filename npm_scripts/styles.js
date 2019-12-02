const paths = require("./paths");
const chalk = require("chalk");

const sass = require("node-sass");
const fs = require('fs');
const mkdirp = require("mkdirp");
const path = require("path");

const autoprefixer = require("autoprefixer");
const postcss = require("postcss");

/**
 * Build sass styles
 */

const buildStyles = function() {
  this.data;
  
  console.log("  Styles:");

  this.build = (filename) => {
    src = path.resolve(__dirname, "../" + paths.SRC.styles + filename + ".css");
    dst = path.resolve(__dirname, "../" + paths.DST.styles + filename + ".scss");
    this.read(src);
    this.compile();
    this.autoprefix();
    this.banner();
    this.write(dst);
  };

  /**
   * Read input from sass file
   */

  this.read = src => {
    this.data = fs.readFileSync(src, { encoding: "UTF8" });
  };

  /**
   * Run input through node-sass
   */

  this.compile = () => {
    // render the result
    var result = sass.renderSync({
      data: this.data,
      outputStyle: "compressed"
    });

    this.data = result.css;
  };

  /**
   * Run input through postcss's autoprefixer
   */

  this.autoprefix = () => {
    postcss([autoprefixer])
      .process(this.data, { from: undefined } )
      .then(result => {
        result.warnings().forEach(warn => {
          console.warn("    " + chalk.yellow(warn.toString()));
        });
        this.css = result.css;
      });
  };

  /**
   * Add banner to destination data
   */

  this.banner = () => {
    this.data = "/* " + process.env.npm_package_name + " " + process.env.npm_package_version + " */ " + this.data;
  }

  /**
   * Write input to destination file
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
scss.build("all");