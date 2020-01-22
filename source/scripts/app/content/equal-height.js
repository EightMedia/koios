/**
 * Resize cards to match height
 */

function resizeCards($section) {
  var $$cards = $section.querySelectorAll(".js-equal-height");
  var maxHeight = 0;

  for (var i = 0, l = $$cards.length; i < l; ++i) {
    var $card = $$cards[i];
    var $head = $card.querySelector(".js-equal-height-resize");
    $head.style.height = "auto";

    var height = $head.getBoundingClientRect().height;
    if (height > maxHeight) {
      maxHeight = height;
    }
  }

  for (i = 0, l = $$cards.length; i < l; ++i) {
    $card = $$cards[i];
    $head = $card.querySelector(".js-equal-height-resize");

    $head.style.height = maxHeight + "px";
  }
}

/**
 * Resize section
 */

function resize() {
  var $$sections = document.querySelectorAll(
    ".section--featured-vacancies, .section--related-vacancies, .section--branches, .section--podcast-grid"
  );
  for (var i = 0, l = $$sections.length; i < l; ++i) {
    resizeCards($$sections[i]);
  }
}

resize();
window.addEventListener("load", resize);
window.addEventListener("resize", resize);
