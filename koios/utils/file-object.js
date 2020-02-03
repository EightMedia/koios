const fs = require("fs");
const path = require("path");

module.exports = ({source, destination, changed, children}) => ({
  source,
  destination,
  changed,
  children,

  /**
   * Make sure the destination exists
   */

  async mkdestination() {
    await fs.promises.mkdir(path.dirname(this.destination), {
      recursive: true
    })

    return this;
  },

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
  },

  /**
   * Write
   */

  async write() {
    return this.mkdestination().then(() =>
      fs.promises.open(this.destination, "w")
        .then(fh => fh.writeFile(this.data, { encoding: "utf8" })
          .then(() => fh.close())
          .then(() => this)
          .catch(err => err)
          )
    );
  }
})