const util = require("util");
const fs = require("fs");
const stream = require("stream");

const { once } = require('events');
const finished = util.promisify(stream.finished);


/**
 * Read the stream as an async iterable
 */

async function read(obj) {
  const readStream = fs.createReadStream(obj.src, { encoding: 'utf8' });

  obj.content = "";
  for await (const chunk of readStream) {
    obj.content += chunk;
  }

  return obj;
}

/**
 * Write 
 */

async function write(obj) {
  const writeStream = fs.createWriteStream(obj.dst, { encoding: 'utf8' });
  
  for await (const chunk of obj.content) {
    if (!writeStream.write(chunk)) {
      // Handle backpressure
      await once(writeStream, 'drain');
    }
  }
  writeStream.end();

  // wait until writing is done
  return finished(writeStream).then(() => obj);
}

module.exports = { read, write }