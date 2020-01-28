const util = require("util");
const fs = require("fs");
const path = require("path");
const stream = require("stream");

// const { once } = require('events');
// const finished = util.promisify(stream.finished);

module.exports = class obj {
  constructor(source, destination, changed, children) {
    this.source = source;
    this.destination = destination;
    this.mkdestination();

    this.changed = changed || null;
    this.children = children || null;

    return this;
  }

  async mkdestination() {
    return await fs.promises.mkdir(path.dirname(this.destination), {
      recursive: true
    });
  }

  /**
   * Read the stream as an async iterable
   */

  async read(data) {
    if (!data) {
      if (!this.source) throw new Error(`No source to read.`);
      const readStream = fs.createReadStream(this.source, { encoding: "utf8" });

      data = "";
      for await (const chunk of readStream) {
        data += chunk;
      }
    }

    this.data = data;

    return this;
  }

  /**
   * Write
   */

  async write() {
    // WRITE STREAM IS SLOWER
    // const writeStream = fs.createWriteStream(this.destination, { encoding: "utf8" });

    // for await (const chunk of this.data) {
    //   if (!writeStream.write(chunk)) {
    //     // Handle backpressure
    //     await once(writeStream, "drain");
    //   }
    // }
    // writeStream.end();

    // // wait until writing is done
    // return finished(writeStream).then(() => this);

    return fs.promises.open(this.destination, "w").then(fh => {
      return fh
        .writeFile(this.data, { encoding: "utf8" })
        .then(() => fh.close())
        .then(() => this)
        .catch(err => err);
    });
  }
};