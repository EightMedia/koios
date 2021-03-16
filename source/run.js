const { paths } = require(`${process.cwd()}/.koiosrc`);
const promiseProgress = require("./utils/promise-progress");
const { Signale } = require("signale");
const readline = require("readline");
const pathDiff = require("./utils/path-diff");
const formatTime = require("./utils/format-time");
const convertMs = require("./utils/convert-ms.js");
const fs = require("fs");

/*
 * Run a single task
 */

const availableTasks = ["assets", "clean", "dev", "pages", "parts", "scripts", "styles"]

async function run({ task, file, verbose }) {
  if (!availableTasks.includes(task)) {
    throw Error(`Unknown task '${task}'. Use one of the following: ${availableTasks.join(", ")}`);
  }

  const log = new Signale({ scope: task, interactive: !verbose });
  
  const start = new Date();
  log.pending(`${formatTime(start)}`, file ? ` (${file})` : '');
  
  await fs.promises.mkdir(paths.roots.to).catch((err) => err);

  const build = require(`./tasks/${task}`);

  return build(file).then(async thinker => {
    return promiseProgress(thinker.thoughts)((i, thought) => {
      log[thought.log.type]({ 
        prefix: `[${(i).toString().padStart(2, "0")}/${thinker.thoughts.length.toString().padStart(2, "0")}]`, 
        message: thought.log.msg
      });
    })
    .then(result => {
      const issues = result.filter(thought => thought.hasIssues());
      const errors = result.filter(thought => thought.hasErrors());
      
      if (!verbose && (issues || errors)) {
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
          log.error(`${thought.log.errors.length} error${thought.log.errors.length !== 1 ? "s" : ""} concerning ${pathDiff(process.cwd(), thought.source)}:`);
          thought.log.errors.forEach((error, i) => log.note({ 
            prefix: `[${(i+1).toString().padStart(2, "0")}/${thought.log.errors.length.toString().padStart(2, "0")}]`, 
            message: error
          }));
        });
      }

      return { total: result.length, issues: issues.length, errors: errors.length };
    })
    .then(async (amounts) => {
      if (typeof thinker.after === "function") await thinker.after();

      const end = new Date();
      const time = convertMs(end.getTime() - start.getTime());
      const errorInfo = amounts.errors > 0 ? `(${amounts.errors} error${amounts.errors === 1 ? '' : 's'})` : '';
      log.complete(`${amounts.total} entr${amounts.total === 1 ? 'y' : 'ies'} in ${time} ${errorInfo}`);
    });
  });
}

/**
 * Entry point
 */

module.exports = async function({ tasks, file, verbose }) {
  if (typeof tasks === "string") tasks = [tasks];
  if (!tasks || tasks.length === 0) tasks = ["clean", "assets", "styles", "scripts", "parts", "pages"];
  const log = new Signale({ scope: "koios" });

  const start = new Date();
  log.pending(`${formatTime(start)}`);
  
  for (let i = 0; i < tasks.length; i++) {
    await run({ task: tasks[i], file, verbose }).catch(err => {
      log.error(err);
      process.exit(1);
    });
  }

  const end = new Date();
  const time = convertMs(end.getTime() - start.getTime());
  log.complete(`${time}`);
}