var constants = window.RWS.constants;

/**
 * Toggle demo grid overlay with control + L
 */

var i = 0;
function toggle() {
  if (i % 2 === 0) {
    // outline every element
    [].forEach.call(document.querySelectorAll("*"), function($a) {
      $a.classList.add("has-debug-outline");
      $a.style.outline = "1px solid #" + (~~(Math.random() * (1 << 24))).toString(16);
    });

    // add grid
    var $grid = document.createElement("div");
    $grid.classList.add("demo-grid-overlay");
    $grid.innerHTML =
      '<div class="demo-grid"><div class="demo-grid__item"><span></span></div><div class="demo-grid__item"><span></span></div><div class="demo-grid__item"><span></span></div><div class="demo-grid__item"><span></span></div><div class="demo-grid__item"><span></span></div><div class="demo-grid__item"><span></span></div><div class="demo-grid__item"><span></span></div><div class="demo-grid__item"><span></span></div><div class="demo-grid__item"><span></span></div><div class="demo-grid__item"><span></span></div><div class="demo-grid__item"><span></span></div><div class="demo-grid__item"><span></span></div></div>';
    document.body.appendChild($grid);
    document.body.classList.add(constants.CLASS_DEBUG);
  } else {
    document.body.removeChild(document.querySelector(".demo-grid-overlay"));
    document.body.classList.remove(constants.CLASS_DEBUG);

    // remove outline from every element
    [].forEach.call(document.querySelectorAll(".has-debug-outline"), function($a) {
      $a.style.outline = "0";
      document.body.classList.remove(constants.CLASS_DEBUG);
    });
  }
  ++i;
}

window.RWS.grid = toggle;

document.addEventListener(
  "keydown",
  function(e) {
    if (e.which === 76 && e.ctrlKey) {
      toggle();
    }
  },
  false
);
