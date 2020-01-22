var constants = require("../constants");

var $header = document.querySelector(".header");

/**
 * Check scroll and set body classes
 * - scrolling up
 * - scrolled to top
 * - scrolled to bottom
 */

var y = document.documentElement.scrollTop;

function onScroll() {
  var scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;

  // scroll direction
  var up = false;
  if (scrollTop < y) {
    up = true;
  }

  if (up) {
    if (!document.body.classList.contains(constants.CLASS_SCROLLING_UP)) {
      document.body.classList.add(constants.CLASS_SCROLLING_UP);
    }
  } else {
    if (document.body.classList.contains(constants.CLASS_SCROLLING_UP)) {
      document.body.classList.remove(constants.CLASS_SCROLLING_UP);
    }
  }

  y = scrollTop;

  // scrolled to top
  var scrolledTop = false;
  var scrolledBottom = false;

  if ($header) {
    if (y <= $header.getBoundingClientRect().height) {
      scrolledTop = true;
    }
  } else {
    if (y === 0) {
      scrolledTop = true;
    }
  }

  if (scrolledTop) {
    if (!document.body.classList.contains(constants.CLASS_SCROLLED_TOP)) {
      document.body.classList.add(constants.CLASS_SCROLLED_TOP);
    }
  } else {
    if (document.body.classList.contains(constants.CLASS_SCROLLED_TOP)) {
      document.body.classList.remove(constants.CLASS_SCROLLED_TOP);
    }
  }

  // scrolled to bottom
  if (y + window.innerHeight >= document.body.offsetHeight) {
    scrolledBottom = true;
  }

  if (scrolledBottom) {
    if (!document.body.classList.contains(constants.CLASS_SCROLLED_BOTTOM)) {
      document.body.classList.add(constants.CLASS_SCROLLED_BOTTOM);
    }
  } else {
    if (document.body.classList.contains(constants.CLASS_SCROLLED_BOTTOM)) {
      document.body.classList.remove(constants.CLASS_SCROLLED_BOTTOM);
    }
  }

  // scrolling main
  if (!scrolledTop && !scrolledBottom) {
    if (!document.body.classList.contains(constants.CLASS_SCROLLED_FREE)) {
      document.body.classList.add(constants.CLASS_SCROLLED_FREE);
    }
  } else {
    if (document.body.classList.contains(constants.CLASS_SCROLLED_FREE)) {
      document.body.classList.remove(constants.CLASS_SCROLLED_FREE);
    }
  }
}

onScroll();
window.addEventListener("scroll", onScroll, { passive: true });
