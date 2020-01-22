var constants = require("../constants");
var Velocity = require("velocity-animate");
var delegate = require("delegate-events");
var findParent = require("find-parent");

/**
 * Open
 */

function open($el, instant) {
  var $content = $el.querySelector(".js-collapsible__content");

  if (!$content) {
    return;
  }

  // add open class to main element
  $el.classList.add(constants.CLASS_OPEN);

  if ($el.classList.contains(constants.CLASS_CLOSED)) {
    $el.classList.remove(constants.CLASS_CLOSED);
  }

  // unhide content
  $content.removeAttribute("hidden");

  // toggle button
  var $toggleButton = $el.querySelector(".js-collapsible__toggle");
  if ($toggleButton) {
    $toggleButton.setAttribute("aria-expanded", true);
  }

  // open button
  var $openButton = $el.querySelector(".js-collapsible__open");
  if ($openButton) {
    $openButton.setAttribute("aria-expanded", true);
    $openButton.setAttribute("tabindex", -1);
  }

  // close button
  var $closeButton = $el.querySelector(".js-collapsible__close");
  if ($closeButton) {
    $closeButton.setAttribute("aria-expanded", false);
    $closeButton.removeAttribute("tabindex");
  }

  // open without animation
  if (instant) {
    Velocity($content, "slideDown", { duration: 0 });

    // open with animation
  } else {
    Velocity($content, "slideDown", {
      duration: 250,
      complete: function() {
        if (!instant && $content) {
          $content.setAttribute("tabindex", "-1");
        }
      }
    });
  }

  // accordeon functionality
  // check if parent is .js-collapsible-accordeon
  // if so, close all but the active one
  var $accordeon = findParent.byClassName($el, "js-collapsible-accordeon");
  if ($accordeon) {
    var $$collapsibles = $accordeon.querySelectorAll(".js-collapsible");
    for (var i = 0, l = $$collapsibles.length; i < l; ++i) {
      var $collapsible = $$collapsibles[i];
      if ($collapsible !== $el) {
        close($collapsible);
      }
    }
  }
}

/**
 * Close
 */

function close($el, instant) {
  var $content = $el.querySelector(".js-collapsible__content");

  if (!$content) {
    return;
  }

  // remove open class from main element
  $el.classList.remove(constants.CLASS_OPEN);
  $el.classList.add(constants.CLASS_CLOSED);

  // hide content
  $content.setAttribute("hidden", true);

  // toggle button
  var $toggleButton = $el.querySelector(".js-collapsible__toggle");
  if ($toggleButton) {
    $toggleButton.setAttribute("aria-expanded", false);
    $toggleButton.blur();
  }

  // open button
  var $openButton = $el.querySelector(".js-collapsible__open");
  if ($openButton) {
    $openButton.setAttribute("aria-expanded", false);
    $openButton.removeAttribute("tabindex");

    if (!instant && $openButton) {
      $openButton.focus();
    }
  }

  // close button
  var $closeButton = $el.querySelector(".js-collapsible__close");
  if ($closeButton) {
    $closeButton.setAttribute("aria-expanded", true);
    $closeButton.setAttribute("tabindex", -1);
  }

  // hide without animation
  if (instant) {
    Velocity($content, "slideUp", { duration: 0 });

    // hide with animation
  } else {
    Velocity($content, "slideUp", { duration: 250 });
  }
}

/**
 * Toggle collapsible fragment el
 */

function toggle(e) {
  var $el = findParent.byClassName(e.delegateTarget, "js-collapsible");
  if ($el) {
    if (!$el.classList.contains(constants.CLASS_OPEN)) {
      open($el);
    } else {
      close($el);
    }
  }
}

delegate.bind(document.body, ".js-collapsible__toggle", "click", toggle);

/**
 * Click open
 */

function onOpenClick(e) {
  var $el = findParent.byClassName(e.delegateTarget, "js-collapsible");
  open($el);
}

delegate.bind(document.body, ".js-collapsible__open", "click", onOpenClick);

/**
 * Click close
 */

function onCloseClick(e) {
  var $el = findParent.byClassName(e.delegateTarget, "js-collapsible");
  close($el);
}

delegate.bind(document.body, ".js-collapsible__close", "click", onCloseClick);

/**
 * Initial toggle
 */

var $$collapsibles = document.querySelectorAll(".js-collapsible");
for (var i = 0, l = $$collapsibles.length; i < l; ++i) {
  var $el = $$collapsibles[i];

  if ($el.classList.contains(constants.CLASS_OPEN)) {
    open($el, true);
  } else {
    close($el, true);
  }
}
