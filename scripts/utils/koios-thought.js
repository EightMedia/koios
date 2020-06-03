const pathDiff = require("./path-diff");
const fs = require("fs");
const path = require("path");
const { promisify } = require("util");
const stream = require("stream");

const { once } = require('events');
const finished = promisify(stream.finished);

module.exports = ({source, destination, changed, children, data}) => ({
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
    const readStream = fs.createReadStream(this.source, { encoding: "utf8" });

    let data = "";
    for await (const chunk of readStream) {
      data += chunk;
    }

    this.data = data;

    return this;
  },

  /**
   * Write
   */

  async write() {
    if (!this.destination) return this.error(`No destination to write to.`);
    await fs.promises.mkdir(path.dirname(this.destination), {
      recursive: true
    });
    const writeStream = fs.createWriteStream(this.destination, { encoding: "utf8" });

    for await (const chunk of this.data) {
      if (!writeStream.write(chunk)) {
        // Handle backpressure
        await once(writeStream, "drain");
      }
    }
    writeStream.end();

    // wait until writing is done
    await finished(writeStream);
    
    return this;
  },

  /**
   * Set error
   */

  async error(err) {
    const msg = err instanceof Error ? err : new Error(err);
    this.log = this.log || { type: "error", msg };
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

  hasError() {
    return this.log && this.log.type === "error";
  }
})