var delegate = require("delegate-events");
var findParent = require("find-parent");
var focusTrap = require("../ui/focus-trap");
var bodyScrollLock = require("body-scroll-lock");

var constants = require("../constants");

/**
 * Open takeover
 */

function open(id) {
  var $takeover = document.getElementById(id);
  if (!$takeover || !$takeover.hasAttribute("data-takeover")) {
    return;
  }

  // unhide
  $takeover.removeAttribute("hidden");

  // set open
  $takeover.classList.add(constants.CLASS_OPEN);
  $takeover.classList.remove(constants.CLASS_CLOSED);
  document.body.classList.add(constants.CLASS_MODAL_OPEN + "--takeover");

  // store current focus
  focusTrap.setReturnFocus();

  // listen to keyboard
  document.addEventListener("keydown", onKeyDown, false);

  // trap focus inside element
  $takeover.setAttribute("tabindex", "-1");
  focusTrap.enable($takeover, $takeover);

  // focus on scrolling area
  var $scroller = $takeover.querySelector(".js-takeover-body-wrap");
  $scroller.addEventListener("scroll", onScroll, { passive: true });

  onScroll({
    target: $scroller
  });

  bodyScrollLock.disableBodyScroll($scroller);
}

/**
 * Close single takeover
 */

function close(id) {
  var $takeover = document.getElementById(id);
  if (!$takeover || !$takeover.hasAttribute("data-takeover")) {
    return;
  }

  // reset scroller area
  var $scroller = $takeover.querySelector(".js-takeover-body-wrap");
  $scroller.removeEventListener("scroll", onScroll);
  bodyScrollLock.enableBodyScroll($scroller);

  focusTrap.disable();

  // stop listening for keydown
  document.removeEventListener("keydown", onKeyDown);

  // not open
  $takeover.classList.remove(constants.CLASS_OPEN);
  $takeover.classList.add(constants.CLASS_CLOSING);

  // final close after animation ends
  $takeover.addEventListener("animationend", afterClose);
}

/**
 * After close animation
 */

function afterClose(e) {
  var $takeover = e.target;
  $takeover.classList.remove(constants.CLASS_CLOSING);
  $takeover.classList.add(constants.CLASS_CLOSED);
  document.body.classList.remove(constants.CLASS_MODAL_OPEN + "--takeover");

  // hide
  $takeover.setAttribute("hidden", true);

  // stop listening
  $takeover.removeEventListener("animationend", afterClose);
}

/**
 * Listen for show button clicks
 */

function onOpenButtonClick(e) {
  var $btn = e.delegateTarget;
  var rel = $btn.getAttribute("aria-controls");

  if (rel) {
    open(rel);
    setHash(rel);
  }
}

delegate.bind(document.body, ".js-takeover-open", "click", onOpenButtonClick);

/**
 * Listen to close button
 */

function onCloseButtonClick(e) {
  var $btn = e.delegateTarget;
  var rel = $btn.getAttribute("aria-controls");
  if (rel) {
    close(rel);
    removeHash();
  }
}

delegate.bind(document.body, ".js-takeover-close", "click", onCloseButtonClick);

/**
 * Close all open takeovers
 */

function closeAll() {
  var $$takeovers = document.querySelectorAll(".js-takeover." + constants.CLASS_OPEN);
  for (var i = 0, l = $$takeovers.length; i < l; ++i) {
    close($$takeovers[i].getAttribute("id"));
  }
}

/**
 * Close on escape press
 */

function onKeyDown(e) {
  if (e.which === constants.KEY_ESCAPE) {
    closeAll();
    removeHash();
  }
}

/**
 * Listen to anchor links
 */

function onAnchorLinkClick(e) {
  // check if it's an internal link
  var $target = e.delegateTarget;
  var href = $target.getAttribute("href");
  if (href.indexOf("#") !== 0) {
    return;
  }

  // check if related element is a takeover
  var $rel = document.getElementById(href.substring(1));
  if ($rel) {
    if (!$rel.hasAttribute("data-takeover")) {
      return;
    }
  }

  // prevent reload and set hash
  e.preventDefault();
  setHash(href.substring(1));

  // open takeover
  closeAll();
  open(href.substring(1));
}

delegate.bind(document.body, "a", "click", onAnchorLinkClick);

/**
 * Try opening when location contains hash
 */

if (location.hash) {
  try {
    open(location.hash.substring(1));
  } catch (err) {
    console.log(err);
  }
}

/**
 * On pop state
 */

function setHash(id) {
  history.pushState(null, "", "#" + id);
}

function removeHash() {
  history.pushState(null, "", window.location.pathname);
}

function onPopState() {
  if (!location.hash) {
    closeAll();
    return;
  } else {
    closeAll();
    open(location.hash.substring(1));
  }
}

window.addEventListener("popstate", onPopState);

/**
 * Scroll behavior
 */

/**
 * Check scroll and set body classes
 * - scrolling up
 * - scrolled to top
 * - scrolled free
 * - scrolled to bottom
 */

var y = 0;

function onScroll(e) {
  var $scroller = e.target;
  var $body = $scroller.querySelector(".js-takeover-body");
  var $takeover = findParent.byClassName($body, "js-takeover");

  var scrollTop = $scroller.scrollTop || 0;

  // scroll direction
  var up = false;
  if (scrollTop < y) {
    up = true;
  }

  if (up) {
    if (!$takeover.classList.contains(constants.CLASS_SCROLLING_UP)) {
      $takeover.classList.add(constants.CLASS_SCROLLING_UP);
    }
  } else {
    if ($takeover.classList.contains(constants.CLASS_SCROLLING_UP)) {
      $takeover.classList.remove(constants.CLASS_SCROLLING_UP);
    }
  }

  y = scrollTop;

  // scrolled to top
  var scrolledTop = false;
  var scrolledBottom = false;

  if (y === 0) {
    scrolledTop = true;
  }

  if (scrolledTop) {
    if (!$takeover.classList.contains(constants.CLASS_SCROLLED_TOP)) {
      $takeover.classList.add(constants.CLASS_SCROLLED_TOP);
    }
  } else {
    if ($takeover.classList.contains(constants.CLASS_SCROLLED_TOP)) {
      $takeover.classList.remove(constants.CLASS_SCROLLED_TOP);
    }
  }

  // scrolled to bottom
  if (y + $scroller.getBoundingClientRect().height >= Math.floor($body.getBoundingClientRect().height)) {
    scrolledBottom = true;
  }

  if (scrolledBottom) {
    if (!$takeover.classList.contains(constants.CLASS_SCROLLED_BOTTOM)) {
      $takeover.classList.add(constants.CLASS_SCROLLED_BOTTOM);
    }
  } else {
    if ($takeover.classList.contains(constants.CLASS_SCROLLED_BOTTOM)) {
      $takeover.classList.remove(constants.CLASS_SCROLLED_BOTTOM);
    }
  }

  // scrolling main
  if (!scrolledTop && !scrolledBottom) {
    if (!$takeover.classList.contains(constants.CLASS_SCROLLED_FREE)) {
      $takeover.classList.add(constants.CLASS_SCROLLED_FREE);
    }
  } else {
    if ($takeover.classList.contains(constants.CLASS_SCROLLED_FREE)) {
      $takeover.classList.remove(constants.CLASS_SCROLLED_FREE);
    }
  }
}
