const { paths } = require(`${process.cwd()}/.koiosrc`);
const promiseProgress = require("./utils/promise-progress");
const { Signale } = require("signale");
const readline = require("readline");
const pathDiff = require("./utils/path-diff");
const formatTime = require("./utils/format-time");
const convertMs = require("./utils/convert-ms.js");
const fs = require("fs");

const logger = new Signale({ interactive: true });

/**
 * Run a task
 */

const availableTasks = ["bump", "clean", "dev", "pages", "parts", "resources", "robots", "scripts", "styles", "symlinks"]

module.exports = async function(task, input) {
  if (!availableTasks.includes(task)) {
    throw Error("Use one of the following tasks: " + availableTasks.join(", "));
  }

  const fn = require(`./tasks/${task}`);
  const start = new Date();

  const log = logger.scope(task);
  log.pending(`${formatTime(start)}`, input ? ` (${input})` : '');

  await fs.promises.mkdir(paths.roots.to).catch((err) => err);

  return fn(input).then(async thinker => {
    return promiseProgress(thinker.thoughts)((i, thought) => {
      log[thought.log.type]({ 
        prefix: `[${(i).toString().padStart(2, "0")}/${thinker.thoughts.length.toString().padStart(2, "0")}]`, 
        message: thought.log.msg
      });
    })
    .then(result => {
      const issues = result.filter(thought => thought.hasIssues());
      const errors = result.filter(thought => thought.hasError());
      
      if (issues || errors) {
        readline.moveCursor(process.stdout, 0, -1);
        readline.clearLine(process.stdout);
        readline.cursorTo(process.stdout, 0);
        log._interactive = false;  
      }

      if (issues.length > 0) {
        issues.forEach(thought => {
          log.warn(`${thought.log.issues.length} issue${thought.log.issues.length !== 1 ? "s" : ""} concerning ${pathDiff(process.cwd(), thought.source)}:`);
          thought.log.issues.forEach((issue, i) => log.note({ 
            prefix: `[${(i+1).toString().padStart(2, "0")}/${thought.log.issues.length.toString().padStart(2, "0")}]`, 
            message: issue
          }));
        });
      }

      if (errors.length > 0) {
        errors.forEach(thought => {
          log.error(`${pathDiff(process.cwd(), thought.source)}:\n${thought.log.stack}`);
        });
      }
    })
    .finally(async () => {
      if (typeof thinker.after === "function") await thinker.after();

      const end = new Date();
      const time = convertMs(end.getTime() - start.getTime());
      log.complete(`${time}`);
    });
  });
}