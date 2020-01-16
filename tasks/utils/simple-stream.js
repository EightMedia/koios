const util = require("util");
const fs = require("fs");
const path = require("path");
const stream = require("stream");

const { once } = require('events');
const finished = util.promisify(stream.finished);

module.exports = class obj {

  constructor(src, dst) {
    // if src isn't a path object assume it contains data
    if (typeof src === "object") this.src = src;
    else this.data = src;

    this.dst = dst;
    this.mkdst();

    return this;
  }

  async mkdst() {
    if (typeof this.dst !== "object") throw new Error("Dst must be a NodeJS Path Object. Received " + typeof this.dst);
    await fs.promises.mkdir(this.dst.dir, { recursive: true });
  }

  /**
   * Read the stream as an async iterable
   */

  async read() {
    if (typeof this.src !== "object") throw new Error("Src must be a NodeJS Path Object. Received " + typeof this.src);

    const readStream = fs.createReadStream(path.format(this.src), { encoding: 'utf8' });

    let data = "";
    for await (const chunk of readStream) {
      data += chunk;
    }

    this.data = data;

    return this;
  }

  /**
   * Write 
   */

  async write() {
    if (typeof this.dst !== "object") throw new Error("Dst must be a NodeJS Path Object. Received " + typeof this.dst);

    const writeStream = fs.createWriteStream(path.format(this.dst), { encoding: 'utf8' });

    for await (const chunk of this.data) {
      if (!writeStream.write(chunk)) {
        // Handle backpressure
        await once(writeStream, 'drain');
      }
    }
    writeStream.end();

    // wait until writing is done
    return finished(writeStream).then(() => this);
  }
}