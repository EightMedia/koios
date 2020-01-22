var findParent = require("find-parent");
var delegate = require("delegate-events");
var dispatcher = require("../dispatcher");
var constants = require("../constants");
var focusTrap = require("../ui/focus-trap");

var $menu = document.querySelector(".js-menu");
var $content = document.querySelector("#content");

if ($menu) {
  var $btnToggle = $menu.querySelector(".js-menu-toggle");
  var $btnClose = $menu.querySelector(".js-menu-close");
}

/**
 * Hamburger toggle
 */

function onToggleClick(e) {
  var $button = e.delegateTarget;

  if (!$menu.classList.contains(constants.CLASS_OPEN)) {
    openMain();
    $button.setAttribute("aria-expanded", true);
    $btnClose.setAttribute("aria-expanded", true);
  } else {
    closeMain();
    $button.setAttribute("aria-expanded", false);
    $btnClose.setAttribute("aria-expanded", false);
  }
}

delegate.bind(document.body, ".js-menu-toggle", "click", onToggleClick);

/**
 * Close click
 */

function onCloseClick(e) {
  var $button = e.delegateTarget;

  closeMain();
  $btnToggle.setAttribute("aria-expanded", false);
  $button.setAttribute("aria-expanded", false);
}

delegate.bind(document.body, ".js-menu-close", "click", onCloseClick);

/**
 * Open main menu
 */

function openMain() {
  var rect = $content.getBoundingClientRect();
  $content.style.top = rect.y + "px";
  document.body.dataset.scrollY = window.scrollY;

  document.body.classList.add(constants.CLASS_MENU_OPEN);
  $menu.classList.add(constants.CLASS_OPEN);
  $menu.classList.remove(constants.CLASS_CLOSED);

  $btnClose.removeAttribute("hidden");

  var $label = $btnToggle.querySelector(".menu__head__toggle__label");
  $label.textContent = "Sluiten";

  var $menuBody = $menu.querySelector(".js-menu-body");
  var $searchItem = $menuBody.querySelector(".menu__body__item--search");
  $menuBody.insertBefore($searchItem, $menuBody.childNodes[0]);

  var $$activeItems = $menu.querySelectorAll(".js-menu-body-item.is-active > a, .js-menu-sub-item.is-active > a");
  focusTrap.setReturnFocus();
  focusTrap.enable($menu, $$activeItems.item($$activeItems.length - 1));
}

/**
 * Close main menu
 */

function closeMain() {
  document.body.classList.remove(constants.CLASS_MENU_OPEN);
  $menu.classList.remove(constants.CLASS_OPEN);
  $menu.classList.add(constants.CLASS_CLOSED);

  $btnClose.setAttribute("hidden", true);

  var $label = $btnToggle.querySelector(".menu__head__toggle__label");
  $label.textContent = "Menu";

  var $menuBody = $menu.querySelector(".js-menu-body");
  var $searchItem = $menuBody.querySelector(".menu__body__item--search");
  $menuBody.appendChild($searchItem);

  $content.style.top = "auto";
  window.scrollTo(0, document.body.dataset.scrollY);

  focusTrap.disable();
}

/**
 * Open submenu
 */

function openSubmenu(e) {
  var $item = e.delegateTarget;

  // closeAllSubmenus();

  if (!$item.classList.contains(constants.CLASS_OPEN)) {
    $item.classList.remove(constants.CLASS_CLOSED);
    $item.classList.add(constants.CLASS_OPEN);
  }
}

/**
 * Close submenu delayed
 */

function closeSubmenuDelayed(e) {
  var $item = e.delegateTarget;

  if (!$item.classList.contains(constants.CLASS_CLOSING)) {
    $item.classList.add(constants.CLASS_CLOSING);

    $item.timeoutID = setTimeout(
      function() {
        closeSubmenu(e);
      }.bind(null, e),
      200
    );
  }
}

/**
 * Remove timer
 */

function removeTimer(e) {
  var $item = e.delegateTarget;

  if ($item.timeoutID) {
    $item.classList.remove(constants.CLASS_CLOSING);
    clearTimeout($item.timeoutID);
    delete $item.timeoutID;
  }
}

/**
 * Close submenu
 */

function closeSubmenu(e) {
  if (e.relatedTarget !== null) {
    var subItem = findParent.byClassName(e.relatedTarget, "js-menu-sub-item");
    var mainItem = findParent.byClassName(e.relatedTarget, "js-menu-body-item");

    // do nothing if it's a submenu item
    if (subItem && mainItem.isSameNode(e.delegateTarget)) return;
  }

  var $item = e.delegateTarget;
  $item.classList.remove(constants.CLASS_OPEN);
  $item.classList.remove(constants.CLASS_CLOSING);
  $item.classList.add(constants.CLASS_CLOSED);
  delete $item.timeoutID;
}

/**
 * Close all submenu's
 */

function closeAllSubmenus() {
  var $$submenus = document.querySelectorAll(".js-menu-body-item.is-open");

  $$submenus.forEach(function($submenu) {
    closeSubmenu({ delegateTarget: $submenu });
  });
}

/**
 * Switch between mobile/tablet or desktop
 */

function onResize() {
  if (!$menu) return;

  if (window.RWS.breakpoint.get() !== constants.DESKTOP) {
    // unbind desktop events
    delegate.unbind(document.body, "mouseover", openSubmenu);
    delegate.unbind(document.body, "mouseover", removeTimer);
    delegate.unbind(document.body, "mouseout", closeSubmenuDelayed);
    delegate.unbind(document.body, "focus", openSubmenu);
    delegate.unbind(document.body, "blur", closeSubmenu);
  } else {
    closeMain();

    // open on mouseover
    delegate.bind(document.body, ".js-menu-body-item", "mouseover", openSubmenu);

    // prevent delayed close when mouse is over the item again
    delegate.bind(document.body, ".js-menu-body-item.is-closing", "mouseover", removeTimer);

    // close delayed on mouseout
    delegate.bind(document.body, ".js-menu-body-item", "mouseout", closeSubmenuDelayed);

    // open on focus
    delegate.bind(document.body, ".js-menu-body-item", "focus", openSubmenu);

    // close on blur
    delegate.bind(document.body, ".js-menu-body-item", "blur", closeSubmenu);
  }
}

dispatcher.on(constants.EVENT_RESIZE, onResize); // on resize
onResize(); // on page load

/**
 * Close on escape
 */

document.addEventListener("keydown", function(e) {
  if (e.which == constants.KEY_ESCAPE) {
    closeMain();
    closeAllSubmenus();
  }
});
