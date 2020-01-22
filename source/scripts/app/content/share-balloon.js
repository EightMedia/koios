var delegate = require("delegate-events");
var findParent = require("find-parent");
var constants = require("../constants");

/**
 * Open/close on click
 */

function onClick(e) {
  var $balloon = findParent.byClassName(e.delegateTarget, "js-share-balloon");

  if ($balloon.classList.contains(constants.CLASS_OPEN)) {
    $balloon.classList.remove(constants.CLASS_OPEN);
  } else {
    $balloon.classList.add(constants.CLASS_OPEN);
  }
}

delegate.bind(document.body, ".js-share-balloon-button", "click", onClick);

/**
 * Close when focus is lost
 */

function onBlur(e) {
  var $balloon = e.delegateTarget;
  $balloon.classList.remove(constants.CLASS_OPEN);
}

delegate.bind(document.body, ".js-share-balloon", "blur", onBlur);
