var delegate = require("delegate-events");
var findParent = require("find-parent");
var focusTrap = require("../ui/focus-trap");
var constants = require("../constants");

function openGallery(e) {
  e.preventDefault();
  var $pswp = document.querySelector(".pswp");

  if (!$pswp) {
    throw new Error("Photoswipe element not found.");
  }

  var $active = e.delegateTarget;
  var $gallery = findParent.byClassName($active, "js-gallery");
  var $$items = $gallery.querySelectorAll(".js-gallery-item");

  var images = [];
  for (var i = 0, l = $$items.length; i < l; i++) {
    var dimensions = $$items[i].dataset.dimensions.split("x");
    images.push({
      src: $$items[i].getAttribute("href"),
      w: dimensions[0],
      h: dimensions[1],
      title: $$items[i].title
    });
  }

  var options = {
    index: Array.prototype.indexOf.call($$items, $active),
    history: true,
    showHideOpacity: true,
    closeOnScroll: true
  };

  var gallery = new window.PhotoSwipe($pswp, window.PhotoSwipeUI_Default, images, options);

  gallery.init();

  focusTrap.enable($pswp, $pswp.querySelector(".pswp__button--close"));

  document.body.classList.add(constants.CLASS_PHOTOSWIPE_OPEN);

  gallery.listen("close", function() {
    focusTrap.disable();
    document.body.classList.remove(constants.CLASS_PHOTOSWIPE_OPEN);
  });
}

delegate.bind(document.body, ".js-gallery-item", "click", openGallery);
