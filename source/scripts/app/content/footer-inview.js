var constants = require("../constants");
var inView = require("in-view/dist/in-view.min");

function footerInView() {
  document.body.classList.add(constants.CLASS_FOOTER_INVIEW);
}

function footerOutView() {
  document.body.classList.remove(constants.CLASS_FOOTER_INVIEW);
}

inView.offset({ bottom: 0 });
inView.threshold(0);
inView(".footer")
  .on("enter", footerInView)
  .on("exit", footerOutView);
