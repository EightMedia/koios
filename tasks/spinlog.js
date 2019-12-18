const chalk = require("chalk");
require("draftlog").into(console);

/**
 * const SL = new SpinLog("Start");
 * SL.set("Proceeding");
 * SL.finish("Success");
 * SL.fail("Error");
 */

const SpinLog = function(text) {
  this.rate = 80;
  this.frame = 0;
  this.frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  this.log = console.draft();

  /**
   * Set new text
   */

  this.set = (text) => {
    this.text = text;
  }

  /**
   * End with ✔ before text
   */

  this.finish = (text) => {
    clearInterval(this.interval);
    this.set(text);
    this.log(chalk.greenBright("✔") + " " + this.text);
  }

  /**
   * End with ✖ before text
   */

  this.fail = text => {
    clearInterval(this.interval);
    this.set(text);
    this.log(chalk.redBright("✖") + " " + this.text);
  };

  /**
   * Refresh spinner every ${this.rate}ms
   */

  this.refresh = () => {
    this.frame = (this.frame + 1) % this.frames.length;
    this.log(this.frames[this.frame] + " " + this.text);
  };

  /**
   * Initialize interval
   */

  this.run = text => {
    this.set(text);
    this.interval = setInterval(this.refresh, this.rate);
  };

  this.run(text);
}

module.exports = SpinLog;