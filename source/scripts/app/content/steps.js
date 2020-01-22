var constants = require("../constants");

/**
 * Watch the steps in a list
 */

function watchSteps($list) {
  // At which point should the step be activated?
  var trigger = window.innerHeight * 0.4; // 40vh

  // Get steps from list
  var $$steps = $list.querySelectorAll(".js-steps-item");

  var $$passedSteps = [];

  // Add active-class if step passes trigger,
  // remove if when user scrolls back
  for (var i = 0, l = $$steps.length; i < l; i++) {
    var $step = $$steps[i];

    $step.classList.remove(constants.CLASS_ACTIVE);

    if ($step.getBoundingClientRect().top < trigger) {
      $$passedSteps.push($step);
    }
  }

  if ($$passedSteps.length > 0) {
    $$passedSteps[$$passedSteps.length - 1].classList.add(constants.CLASS_ACTIVE);
  } else {
    $$steps[0].classList.add(constants.CLASS_ACTIVE);
  }
}

/**
 * Add event listener for each step-list
 */

var $$steplists = document.querySelectorAll(".js-steps");

for (var i = 0, l = $$steplists.length; i < l; i++) {
  var $steplist = $$steplists[i];

  // once on page load
  watchSteps($steplist);

  // listen to scroll-event and pass $steplist as an argument
  window.addEventListener(
    "scroll",
    (function($list) {
      return function() {
        watchSteps($list);
      };
    })($steplist),
    { passive: true }
  );
}
