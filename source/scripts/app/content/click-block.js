var delegate = require("delegate-events");

/**
 * Make blocks clickable based on a link inside
 * div.js-click-block <-- this is clickable
 *  span foo
 *  div
 *    a(href='') link <-- the actual link
 */

function onBlockClick(e) {
  var $link = e.delegateTarget.querySelector("a");
  if ($link !== e.target) {
    e.preventDefault();
    location.href = $link.href;
  }
}

delegate.bind(document.body, ".js-click-block", "click", onBlockClick);
