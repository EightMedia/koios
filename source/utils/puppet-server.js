const { paths } = require(`${process.cwd()}/.koiosrc`);
const serveStatic = require("serve-static");
const http = require("http");
const finalhandler = require("finalhandler");
const killable = require("killable");
const puppeteer = require("puppeteer");

exports.start = () => {
  return new Promise(async resolve => { 
    // start browser
    exports.browser = await puppeteer.launch({ headless: true });

    // start server
    const serve = serveStatic(paths.roots.to);
    exports.server = http.createServer(function(req, res) {
      serve(req, res, finalhandler(req, res));
    });

    exports.server.listen(3333);
    killable(exports.server);
    exports.server.on("error", (err) => {});
    process.on("exit", () => exports.stop());

    // say we're ready
    exports.server.on("listening", () => {
      resolve();
    });
  });
}

exports.stop = () => {
  exports.browser.close();
  exports.server.kill();
  process.removeListener("exit", () => exports.stop());
}
