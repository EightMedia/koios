var constants = require("../constants");

/**
 * Find all external links inside .richtext article fragments
 * and add an external icon to them.
 * <a href="http://google.com">Google</a>
 * becomes
 * <a href="http://google.com">Google <svg class="icon-external" aria-hidden="true"><use xlink:href="#external"></use></svg></a>
 */

function iconify($$links, excludeSelector) {
  for (var i = 0, l = $$links.length; i < l; ++i) {
    var $link = $$links[i];

    // check if this link matches our exclude selector
    if ($link.matches(excludeSelector)) {
      continue;
    }

    var type = null;
    if (location.hostname !== $link.hostname) {
      type = constants.LINK_TYPE_EXTERNAL;
    }

    if ($link.hasAttribute("download")) {
      type = constants.LINK_TYPE_DOWNLOAD;
    }

    if (type !== null) {
      // remove existing svg if it exists
      var $oldSvg = $link.querySelector("svg");
      if ($oldSvg) {
        $oldSvg.parentNode.removeChild($oldSvg);
      }

      // create svg
      var $svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      $svg.classList.add("icon-" + type);
      $svg.setAttribute("aria-role", "img");
      $svg.setAttribute("aria-labelledby", "title");

      // append title tag
      var $title = document.createElementNS("http://www.w3.org/2000/svg", "title");
      $svg.appendChild($title);

      // append use tag
      var $use = document.createElementNS("http://www.w3.org/2000/svg", "use");
      $use.setAttributeNS("http://www.w3.org/1999/xlink", "href", "#" + type);
      $svg.appendChild($use);

      // append svg icon
      if (type === constants.LINK_TYPE_EXTERNAL) {
        $svg.setAttribute("viewBox", "0 0 24 24");
        $svg.setAttribute("width", "24");
        $svg.setAttribute("height", "24");
        $link.appendChild($svg);
        $title.textContent = constants.LABEL_EXTERNAL_LINK;
      }
    }
  }
}

iconify(
  document.querySelectorAll(".richtext a, a.button, a.stronglink"),
  ".fixed-cta__buttons a.button, .vacancy-apply__button-wrap .button"
);
