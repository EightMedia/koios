var focusTrap = require("focus-trap");
var tabbable = require("tabbable");
var assign = require("object-assign");

/**
 * Trap focus
 */

var focusTrapInstance;
var $prevFocus = null;

function enable($el, $initialFocus, options) {
  setTimeout(function() {
    focusTrapInstance = focusTrap(
      $el,
      assign(
        {},
        {
          initialFocus: $initialFocus,
          escapeDeactivates: false,
          clickOutsideDeactivates: true
        },
        options
      )
    ).activate();
  }, 0);
}

module.exports.enable = enable;

/**
 * Stop trap focus
 */

function disable() {
  if (focusTrapInstance) {
    focusTrapInstance.deactivate();
    focusTrapInstance = null;

    if ($prevFocus && tabbable.isFocusable($prevFocus)) {
      $prevFocus.focus();
    }

    $prevFocus = null;
  }
}

module.exports.disable = disable;

/**
 * Save active element to be able to return focus to it later
 * this is need because some modals hide <body> and make them
 * unfocusable before setting the focus trap – so we have to
 * manually save it before disabling body focus
 *
 * - 1. store focus
 * - 2. set body classes
 * - 3. enable focus trap
 */

function setReturnFocus() {
  $prevFocus = document.activeElement;
}

module.exports.setReturnFocus = setReturnFocus;
