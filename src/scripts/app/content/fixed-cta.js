var constants = require("../constants");
var dispatcher = require("../dispatcher");

var $trigger = document.querySelector(".js-fixed-cta-trigger");
var $fixedCta = document.querySelector(".js-fixed-cta");

function watchTrigger() {
  if (!$fixedCta.classList.contains(constants.CLASS_OPEN)) {
    if ($trigger.getBoundingClientRect().top <= 0) {
      show();
    }
  } else if ($fixedCta.classList.contains(constants.CLASS_OPEN)) {
    if ($trigger.getBoundingClientRect().top >= 0) {
      hide();
    }
  }
}

function show() {
  $fixedCta.classList.remove(constants.CLASS_CLOSED);
  $fixedCta.classList.add(constants.CLASS_OPEN);
}

function hide() {
  $fixedCta.classList.remove(constants.CLASS_OPEN);
  $fixedCta.classList.add(constants.CLASS_CLOSED);
}

if ($fixedCta && $trigger) {
  var $testContainer = document.querySelector("body > .fixed-cta-test-container");
  if ($testContainer) {
    var $spacer = document.createElement("div");
    $spacer.style.height = $trigger.getBoundingClientRect().top * 2 + "px";
    $testContainer.insertBefore($spacer, $fixedCta);
    $testContainer.addEventListener("scroll", watchTrigger, { passive: true });
  } else {
    window.addEventListener("scroll", watchTrigger, { passive: true });
  }
  dispatcher.on(constants.EVENT_BREAKPOINT_CHANGE, hide);
}
