/**
 * Wrap a scrollable div around tables inside the body section
 */

function tableify($$tables) {
  for (var i = 0, l = $$tables.length; i < l; ++i) {
    var $table = $$tables[i];
    var $wrapper = document.createElement("div");
    $wrapper.className = "table-wrapper";
    $wrapper.innerHTML = $table.outerHTML;

    $table.parentNode.insertBefore($wrapper, $table);
    $table.parentNode.removeChild($table);
  }
}

tableify(document.querySelectorAll(".richtext table"));
