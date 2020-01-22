var delegate = require("delegate-events");

var constants = require("../constants");

var $field = document.querySelector(".js-vacancies-search-field");

/**
 * Submit
 */

function submitSearch() {
  window.RWS.searchVacancies($field.value);
}

delegate.bind(document.body, ".js-vacancies-search-button", "click", submitSearch);

/**
 * Keyboard actions
 */

function onKeyDown(e) {
  if (e.which === constants.KEY_ESCAPE) {
    window.RWS.searchVacancies("");
    $field.blur();
  }
  if (e.which === constants.KEY_ENTER) {
    submitSearch();
  }
}

/**
 * Set field value on page load and listen to keydown
 */

if ($field) {
  var query = new URLSearchParams(location.search);
  $field.value = query.get("searchString");
  $field.addEventListener("keydown", onKeyDown, false);
}
