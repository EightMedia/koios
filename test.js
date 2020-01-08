const fs = require("fs");
const path = require("path");
const stream = require("stream");
const util = require("util");

async function open(src) {
  let filehandle = await fs.promises.open(src);
  
  const readStream = fs.createReadStream("", { fd: filehandle.fd });
  readStream.on('error', err => {
    console.error('error', err);
  });
  readStream.on('close', () => {
    console.info('close');
  });

  readStream.pipe(new stream.PassThrough());
  
  process.nextTick(() => {
    readStream.destroy();
  });
}

open("src/templates/components/sections/related-articles.pug");