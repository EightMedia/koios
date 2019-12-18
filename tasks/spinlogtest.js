const SpinLog = require("./spinlog");

function go(i) {
  return new Promise((resolve, reject) => {
    const SL = new SpinLog("Start");

    setTimeout(() => {
      SL.set("Wait");
    }, i * 500);

    setTimeout(() => {
      if (Math.random() > .5) {
        SL.finish("Done"); 
      } else {
        SL.fail(`Oeps\n  What went wrong?`);
      }
    }, i * 1000);
  });
}

const promises = [1, 2, 3, 4, 5].map(i => go(i));
