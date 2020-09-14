const { paths } = require(`${process.cwd()}/.koiosrc`);
const promiseProgress = require("./utils/promise-progress");
const { Signale } = require("signale");
const readline = require("readline");
const pathDiff = require("./utils/path-diff");
const formatTime = require("./utils/format-time");
const convertMs = require("./utils/convert-ms.js");
const fs = require("fs");

const logger = new Signale({ scope: "koios", interactive: true });

const availableTasks = ["assets", "clean", "dev", "pages", "parts", "robots", "scripts", "styles"]

async function single(task, file) {
  if (!availableTasks.includes(task)) {
    throw Error(`Unknown task '${task}'. Use one of the following: ${availableTasks.join(", ")}`);
  }

  const build = require(`./tasks/${task}`);
  const start = new Date();

  const log = logger.scope(task);
  log.pending(`${formatTime(start)}`, file ? ` (${file})` : '');

  await fs.promises.mkdir(paths.roots.to).catch((err) => err);

  return build(file).then(async thinker => {
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

      return { total: result.length, issues: issues.length, errors: errors.length };
    })
    .then(async (amounts) => {
      if (typeof thinker.after === "function") await thinker.after();

      const end = new Date();
      const time = convertMs(end.getTime() - start.getTime());
      const errorInfo = amounts.errors > 0 ? `(${amounts.errors} errors)` : '';
      log.complete(`${amounts.total} entr${amounts.total === 1 ? 'y' : 'ies'} in ${time} ${errorInfo}`);
    });
  });
}

/**
 * Run task(s)
 */

module.exports = async function(tasks, file) {
  tasks = Array.isArray(tasks) ? tasks : [tasks];
  const start = new Date();

  if (tasks.length > 1) {
    tasks.unshift(async () => {
      logger.pending(`${formatTime(start)}`);
    });
    tasks.push(async () => {
      const end = new Date();
      const time = convertMs(end.getTime() - start.getTime());
      logger.complete(`${time}`);
    });
  }
  
  // run tasks one after another
  tasks.reduce(async (previousTask, nextTask) => {
    await previousTask;

    if (typeof nextTask === "function") return nextTask();
    
    return single(nextTask, file).catch(err => {
      logger.error(err);
      process.exit(0);
    });
  }, Promise.resolve());
}