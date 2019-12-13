var keyMirror = require("keymirror");
var assign = require("object-assign");

/**
 * Environments
 */

var environments = {
  ENV_PRO: "production",
  ENV_DEV: "development",
  ENV_ACC: "acceptance"
};

/**
 * Classes
 */

var classes = {
  CLASS_ACTIVE: "is-active",
  CLASS_OPEN: "is-open",
  CLASS_CLOSING: "is-closing",
  CLASS_CLOSED: "is-closed",
  CLASS_HIDDEN: "is-hidden",
  CLASS_MENU_OPEN: "has-menu-open",
  CLASS_MODAL_OPEN: "has-modal-open",
  CLASS_DEBUG: "is-debug",
  CLASS_VIDEO_ACCESSIBILITY: "video-accessibility-btn",
  CLASS_SCROLLING_UP: "is-scrolling-up",
  CLASS_SCROLLED_TOP: "is-scrolled-to-top",
  CLASS_SCROLLED_BOTTOM: "is-scrolled-to-bottom",
  CLASS_SCROLLED_FREE: "is-scrolled-free",
  CLASS_FOOTER_INVIEW: "has-footer-inview",
  CLASS_LOADING: "is-loading",
  CLASS_ERROR: "has-error",
  CLASS_SELECTED: "is-selected",
  CLASS_PHOTOSWIPE_OPEN: "has-photoswipe-open"
};

/**
 * Labels
 */

var labels = {
  LABEL_PLAY: "Speel video",
  LABEL_PAUSE: "Pauzeer video",
  LABEL_EXTERNAL: "Externe link"
};

/**
 * Events
 */

var events = keyMirror({
  EVENT_BREAKPOINT_CHANGE: null,
  EVENT_RESIZE: null,
  EVENT_CAROUSEL_SLIDE: null
});

/**
 * Keys
 */

var keys = {
  KEY_ESCAPE: 27,
  KEY_ENTER: 13,
  KEY_TAB: 9,
  KEY_BACKSPACE: 8,
  KEY_DELETE: 46,
  KEY_UP: 38,
  KEY_DOWN: 40
};

/**
 * Sizes
 */

var sizes = {
  BREAKPOINTS: {
    MOBILE: 0,
    TABLET: 768,
    DESKTOP: 1024
  },
  MOBILE: "MOBILE",
  TABLET: "TABLET",
  DESKTOP: "DESKTOP"
};

/**
 * Misc
 */

var misc = {
  VIDEO_AUTOPLAY_PREFERENCE: "video-autoplay-preference",
  LINK_TYPE_EXTERNAL: "external",
  LINK_TYPE_DOWNLOAD: "download",
  TOUCH_MOVE: "is-touching"
};

var constants = assign({}, environments, classes, labels, events, keys, sizes, misc);

module.exports = constants;
