var delegate = require("delegate-events");
var constants = require("../constants");

/**
 * Tab click
 */

function onTabClick(e) {
  var $oldButton = document.querySelector(".js-timeline-button.is-active");
  var $newButton = e.delegateTarget;

  if ($oldButton.isSameNode($newButton)) return;

  $oldButton.classList.remove(constants.CLASS_ACTIVE);
  $oldButton.setAttribute("aria-selected", false);

  $newButton.classList.add(constants.CLASS_ACTIVE);
  $newButton.setAttribute("aria-selected", true);

  var $oldTab = document.querySelector(".js-timeline-tab#" + $oldButton.getAttribute("aria-controls"));
  var $newTab = document.querySelector(".js-timeline-tab#" + $newButton.getAttribute("aria-controls"));

  $oldTab.setAttribute("hidden", true);
  $oldTab.classList.remove(constants.CLASS_ACTIVE);

  $newTab.removeAttribute("hidden");
  $newTab.classList.add(constants.CLASS_ACTIVE);
}

delegate.bind(document.body, ".js-timeline-button", "click", onTabClick);
