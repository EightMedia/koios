var constants = require("../constants");
var dispatcher = require("../dispatcher");
var debounce = require("debounce");

/**
 * Check for breakpoint changes
 * and notify dispatcher if breakpoint changes
 * or if window resizes
 */

var _breakpoint = null;

// check for initial breakpoint
checkBreakpointChange();

// debounce resize events
window.addEventListener("resize", debounce(onResize, 50));
onResize();

/**
 * on resize
 * dispatch window resize
 * check for breakpoint change
 */

function onResize() {
  // notify dispatcher viewport has been resized
  dispatcher.dispatch({
    type: constants.EVENT_RESIZE
  });

  // check for breakpoint change
  checkBreakpointChange();
}

/**
 * Get viewport width
 */

function getViewportWidth() {
  return document.documentElement.clientWidth;
}

/**
 * get current breakpoint
 */

function getBreakpoint() {
  var view = null;

  for (var key in constants.BREAKPOINTS) {
    if (window.matchMedia) {
      if (window.matchMedia("(min-width: " + constants.BREAKPOINTS[key] + "px)").matches) {
        view = key;
      }
    } else {
      if (getViewportWidth() >= constants.BREAKPOINTS[key]) {
        view = key;
      }
    }
  }

  return view;
}

module.exports.get = getBreakpoint;

/**
 * check breakpoint change
 * dispatch event if changed
 */

function checkBreakpointChange() {
  var newBreakpoint = getBreakpoint();

  // if breakpoint changed
  if (newBreakpoint !== _breakpoint) {
    _breakpoint = newBreakpoint;

    // notify dispatcher
    dispatcher.dispatch({
      type: constants.EVENT_BREAKPOINT_CHANGE,
      breakpoint: _breakpoint
    });
  }
}
