const util = require("util");
const fs = require("fs");
const stream = require("stream");

const { once } = require('events');
const finished = util.promisify(stream.finished);


/**
 * Read the stream as an async iterable
 */

async function read(src) {
  const readStream = fs.createReadStream(src, { encoding: 'utf8' });

  let result = '';
  for await (const chunk of readStream) {
    result += chunk;
  }

  return result;
}

/**
 * Write 
 */

async function write(data, dst) {
  const writeStream = fs.createWriteStream(dst, { encoding: 'utf8' });
  
  for await (const chunk of data) {
    if (!writeStream.write(chunk)) {
      // Handle backpressure
      await once(writeStream, 'drain');
    }
  }
  writeStream.end();

  // wait until writing is done
  await finished(writeStream);
}

module.exports = { read, write }