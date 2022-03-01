import { paths } from `${process.cwd()}/.koiosrc`;
import serveStatic from "serve-static";
import http from "http";
import finalhandler from "finalhandler";
import killable from "killable";
import { Cluster } from "puppeteer-cluster";

export function start () {
  return new Promise(async resolve => { 
    // start browser cluster
    exports.cluster = await Cluster.launch({
      concurrency: Cluster.CONCURRENCY_PAGE,
      maxConcurrency: 3,
    });

    // set cluster task to get document height
    await exports.cluster.task(async ({ page, data: url }) => {
      await page.setViewport(Object.assign(page.viewport(), { width: 1200 }));
      await page.goto(url);
      const height = await page.evaluate(() => {
        return document.body.getBoundingClientRect().height;
      });
      return height;
    });

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

export function stop() {
  await exports.cluster.idle();
  await exports.cluster.close();
  exports.server.kill();
  process.removeListener("exit", () => exports.stop());
}
