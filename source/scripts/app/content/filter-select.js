var findParent = require("find-parent");
var delegate = require("delegate-events");
var focusTrap = require("../ui/focus-trap");
var constants = require("../constants");

/**
 * Close the given $select
 */

function closeMenu($select) {
  var $toggle = $select.querySelector(".js-filter-select__toggle");
  $toggle.setAttribute("aria-expanded", "false");

  $select.classList.add(constants.CLASS_CLOSED);
  $select.classList.remove(constants.CLASS_OPEN);

  var $$items = $select.querySelectorAll(".js-filter-select__menu__item");
  for (var i = 0, l = $$items.length; i < l; i++) {
    $$items[i].setAttribute("tabindex", "-1");
  }

  focusTrap.disable();
}

/**
 * Open the given $select
 */

function openMenu($select) {
  var $toggle = $select.querySelector(".js-filter-select__toggle");
  $toggle.setAttribute("aria-expanded", "true");

  $select.classList.add(constants.CLASS_OPEN);
  $select.classList.remove(constants.CLASS_CLOSED);

  var $$items = $select.querySelectorAll(".js-filter-select__menu__item");
  for (var i = 0, l = $$items.length; i < l; i++) {
    $$items[i].setAttribute("tabindex", "0");
  }

  focusTrap.setReturnFocus();
  focusTrap.enable($select.querySelector(".js-filter-select__menu"), $$items[0]);
}

/**
 * Open or close the menu when user clicks the toggle
 */

function onToggleClick(e) {
  var $button = e.delegateTarget;
  var $select = findParent.byClassName($button, "js-filter-select");

  if ($select.classList.contains(constants.CLASS_CLOSED)) {
    openMenu($select);
  } else {
    closeMenu($select);
  }
}

delegate.bind(document.body, ".js-filter-select__toggle", "click", onToggleClick);

/**
 * When filter changes
 */

function onFilterValueChanged(e) {
  var $input = e.delegateTarget;
  var $select = findParent.byClassName($input, "js-filter-select");
  setSelectedOption($select);
}

delegate.bind(document.body, ".js-filter-select__input", "filterValueChanged", onFilterValueChanged);

/**
 * When user clicks a menu item
 */

function onMenuItemClick(e) {
  var $item = e.delegateTarget;
  var $select = findParent.byClassName($item, "js-filter-select");
  var $input = $select.querySelector(".js-filter-select__input");
  $input.value = $item.dataset.value;
  setSelectedOption($select);
  closeMenu($select);

  // tell everyone this select has changed
  var event = document.createEvent("Event");
  event.initEvent("filterChange", true, true);
  $select.dispatchEvent(event);
}

delegate.bind(document.body, ".js-filter-select__menu__item", "click", onMenuItemClick);

/**
 * Keyboard navigation
 */

function onToggleKeyDown(e) {
  var $select = findParent.byClassName(e.delegateTarget, "js-filter-select");

  if (e.which == constants.KEY_DOWN) {
    e.preventDefault();

    if (!$select.classList.contains("is-open")) {
      openMenu($select);
    }
  }

  if (e.which == constants.KEY_UP) {
    e.preventDefault();

    if ($select.classList.contains("is-open")) {
      closeMenu($select);
    }
  }
}

delegate.bind(document.body, ".js-filter-select__toggle", "keydown", onToggleKeyDown);

function onItemKeyDown(e) {
  var $item = e.delegateTarget;
  var $menu = findParent.byClassName(e.delegateTarget, "js-filter-select__menu");

  if (e.which == constants.KEY_DOWN) {
    e.preventDefault();
    if ($item.nextElementSibling) {
      $item.nextElementSibling.focus();
    } else {
      $menu.querySelector(".js-filter-select__menu__item:first-of-type").focus();
    }
  }

  if (e.which == constants.KEY_UP) {
    e.preventDefault();
    if ($item.previousElementSibling) {
      $item.previousElementSibling.focus();
    } else {
      $menu.querySelector(".js-filter-select__menu__item:last-of-type").focus();
    }
  }
}

delegate.bind(document.body, ".js-filter-select__menu__item", "keydown", onItemKeyDown);

/**
 * Close all menu's when user clicks outside of them
 */

function closeAll(e) {
  var $$selects = document.querySelectorAll(".js-filter-select");
  for (var i = 0, l = $$selects.length; i < l; i++) {
    var $select = $$selects[i];
    if (e) {
      if ($select.isSameNode(findParent.byClassName(e.target, "js-filter-select"))) {
        continue;
      }
    }
    closeMenu($select);
  }
}

window.addEventListener("click", closeAll);
window.addEventListener("touchmove", closeAll);

/**
 * Close all menu's when escape is pressed
 */

function onKeyDown(e) {
  if (e.which === constants.KEY_ESCAPE) {
    closeAll();
  }
}

document.addEventListener("keydown", onKeyDown, false);

/**
 * Remove .is-selected class from menu items
 */

function deselectMenuItems($select) {
  var $$options = $select.querySelectorAll(".js-filter-select__menu__item.is-selected");
  for (var i = 0, l = $$options.length; i < l; i++) {
    $$options[i].classList.remove("is-selected");
  }
}

/**
 * Set the selected option
 */

function setSelectedOption($select) {
  var $input = $select.querySelector(".js-filter-select__input");
  var $option = $select.querySelector(".js-filter-select__menu__item[data-value='" + $input.value + "']");
  deselectMenuItems($select);
  $option.classList.add("is-selected");

  // set toggle label
  var $label = $select.querySelector(".js-filter-select__toggle__label");
  var selected = getSelectedOption($select);
  if (selected) {
    $label.textContent = selected.label;
  } else {
    console.log("Geen optie geselecteerd");
  }
}

/**
 * Returns the label and value of the selected option
 */

function getSelectedOption($select) {
  var $selected = $select.querySelector(".js-filter-select__menu__item.is-selected");

  if (!$selected) return null;

  return { label: $selected.textContent, value: $selected.dataset.value };
}

/**
 * Reset the select when the custom filterClear event is fired
 */

function onFilterClear(e) {
  var $select = e.delegateTarget;
  var $input = $select.querySelector(".js-filter-select__input");
  $input.value = "";
  deselectMenuItems($select);
  setSelectedOption($select);
}

delegate.bind(document.body, ".js-filter-select", "filterClear", onFilterClear);

/**
 * Initialize the select
 */

function setup($select) {
  closeMenu($select);
  setSelectedOption($select);
}

/**
 * Gather all selects and put it through our setup
 */

var $$selects = document.querySelectorAll(".js-filter-select");
for (var i = 0, l = $$selects.length; i < l; i++) {
  var $select = $$selects[i];
  setup($select);
}
