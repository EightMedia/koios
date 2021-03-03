const pathDiff = require("./path-diff");
const chalk = require("chalk");
const fs = require("fs").promises;
const path = require("path");

module.exports = ({ source, destination, changed, children, data }) => ({
  source,
  destination,
  changed,
  children,
  data: data || null,

  /**
   * Read the stream as an async iterable
   */

  async read() {
    if (!this.source) return this.error(`No source to read from.`);
    this.data = await fs.readFile(this.source, { encoding: "utf8" });
    return this;
  },

  /**
   * Write
   */

  async write() {
    if (!this.destination) return this.error(`No destination to write to.`);
    await fs.mkdir(path.dirname(this.destination), { recursive: true });
    await fs.writeFile(this.destination, this.data);
    return this;
  },

  /**
   * Set error
   */

  async error(msg) {
    if (msg instanceof Error) {
      msg = {
        msg: pathDiff(process.cwd(), this.source),
        errors: [msg.message]
      }
    }
    this.log = this.log || typeof msg === "string" ? { type: "error", msg } : Object.assign(msg, { type: "error" });
    return this;
  },

  async done(msg) {
    if (!msg) msg = pathDiff(process.cwd(), this.source);
    this.log = this.log || { type: "success", msg };
    return this;
  },

  async info(msg) {
    this.log = this.log || { type: "info", msg };
    return this;
  },

  async warn(msg) {
    this.log = this.log || typeof msg === "string" ? { type: "warn", msg } : Object.assign(msg, { type: "warn" });
    return this;
  },

  hasIssues() {
    return this.log.issues && this.log.type === "warn";
  },

  hasErrors() {
    return this.log.errors && this.log.type === "error";
  }
})