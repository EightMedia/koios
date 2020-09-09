const { paths } = require(`${process.cwd()}/.koiosrc`);
const promiseProgress = require("./utils/promise-progress");
const { Signale } = require("signale");
const logger = new Signale({ interactive: true });
const formatTime = require("./utils/format-time");
const convertMs = require("./utils/convert-ms.js");
const fs = require("fs");

/**
 * Run a task
 */

const availableTasks = ["bump", "clean", "components", "dev", "pages", "resources", "robots", "scripts", "styles", "symlinks"]

module.exports = async function(task, input) {
  if (!availableTasks.includes(task)) {
    throw Error("Use one of the following tasks: " + availableTasks.join(", "));
  }

  const fn = require(`./tasks/${task}.js`).default;
  const start = new Date();

  const log = logger.scope(task);
  log.pending(`started at ${formatTime(start)}`, input ? ` (${input})` : '');

  await fs.promises.mkdir(paths.roots.to).catch((err) => err);

  return fn(input).then(async koios => {
    if (typeof koios.before === "function") await koios.before();

    return promiseProgress(koios.promises)((i, item) => {
      log[item.log.type]({ 
        prefix: `[${(i).toString().padStart(2, "0")}/${koios.promises.length.toString().padStart(2, "0")}]`, 
        message: item.log.msg
      });

      if (item.log.sub) {
        const sublog = new Signale({ scope: [task, item.log.scope] });
        item.log.sub.forEach((issue, i) => sublog.note({ 
          prefix: `[${(i+1).toString().padStart(2, "0")}/${item.log.sub.length.toString().padStart(2, "0")}]`, 
          message: issue
        }));
      }
    })
    .then(result => {
      const errors = result.filter(item => item.hasError());
      
      if (errors.length > 0) {
        log.warn(`Reported ${errors.length} error${errors.length !== 1 ? "s" : ""}`);
      }
    })
    .finally(async () => {
      if (typeof koios.after === "function") await koios.after();

      const end = new Date();
      const time = convertMs(end.getTime() - start.getTime());
      log.complete(`finished in ${time}`);
    });
  });
}