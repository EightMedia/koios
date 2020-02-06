const fs = require("fs");
const path = require("path");
const { promisify } = require("util");
const stream = require("stream");

const { once } = require('events');
const finished = promisify(stream.finished);

module.exports = ({source, destination, changed, children, input}) => ({
  source,
  destination,
  changed,
  children,
  data: input || null,

  /**
   * Read the stream as an async iterable
   */

  async read() {
    if (!this.source) throw new Error(`No source to read.`);
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

  // async write() {
  //   return fs.promises.mkdir(path.dirname(this.destination), { recursive: true })
  //     .then(() => fs.promises.open(this.destination, "w")
  //       .then(fh => fh.writeFile(this.data, { encoding: "utf8" })
  //         .then(() => fh.close())
  //         .then(() => this)
  //         .catch(err => err)
  //         )
  //   );
  // },

  async write() {
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
  }
})