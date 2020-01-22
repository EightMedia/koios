var delegate = require("delegate-events");
var findParent = require("find-parent");

var constants = require("../constants");

// Query parameters
var params = new URLSearchParams(location.search);

// Get short month names (jan, feb, ...)
const monthNames = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(function(mon) {
  return new Date(2000, mon).toLocaleString({}, { month: "short" });
});

// Main container
var $container = document.querySelector(".js-meet-us");

if ($container) {
  // All filter elements
  var $$filters = $container.querySelectorAll(".js-filter-select");

  // hidden inputs for extra parameters
  var $$params = $container.querySelectorAll(".js-meet-us-param");

  // Grid content
  var $content = $container.querySelector(".js-meet-us-content");

  // Footer with +more button
  var $footer = $container.querySelector(".js-meet-us-footer");

  // Card template
  var CARD_TEMPLATE = $container.querySelector(".js-card-meet-us-template");
  var CARD_FEATURED_TEMPLATE = $container.querySelector(".js-card-meet-us-featured-template");
  var EMPTY_TEMPLATE = $container.querySelector(".js-meet-us-empty-template");
}

/**
 * Make card out of item object and template
 */

function makeCard(item, template) {
  /* eslint-disable no-undef */

  var card = document.importNode(template, true);

  var elDate = card.querySelector(".date");
  var elLabel = card.querySelector(".label");

  var startDateString, endDateString;

  if (item.startDate) {
    item.startDate = new Date(item.startDate);
    startDateString = item.startDate.toLocaleDateString();
  }
  if (item.endDate) {
    item.endDate = new Date(item.endDate);
    endDateString = item.endDate.toLocaleDateString();
  }

  // check if item is 'event' or 'article'
  if (item.category.toLowerCase() === CARD_EVENT_CATEGORY.toLowerCase()) {
    if (elLabel) elLabel.parentElement.remove();
    if (startDateString === endDateString) {
      var dateDash = card.querySelector(".date__dash");
      if (dateDash) dateDash.remove();
      var dateTo = card.querySelector(".date--to");
      if (dateTo) dateTo.remove();
    }
  } else {
    if (elDate) elDate.parentElement.remove();
  }

  // remove label icon
  if (!item.multimediaIcon) {
    var elIcon = card.querySelector(".label__icon");
    if (elIcon) {
      elIcon.remove();
    }
  }

  // select teaser title and intro when present
  if (item.teaserTitle) item.title = item.teaserTitle;
  if (item.teaserIntro) item.intro = item.teaserIntro;

  // create ghost div and append card
  var div = document.createElement("div");
  div.appendChild(card);

  div.innerHTML = div.innerHTML
    .replace(/\$\{title\}/g, item.title)
    .replace(/\$\{text\}/g, item.intro)
    .replace(/\$\{linkToSelf\}/g, item.linkToSelf.link)
    .replace(/\$\{icon\}/g, item.multimediaIcon)
    .replace(/\$\{category\}/g, item.category)
    .replace(/\$\{image\}/g, item.teaserImage.url)
    .replace(/\$\{imgixParams\}/g, item.teaserImageImgixParams || "fit=crop&crop=entropy");

  if (item.category.toLowerCase() === CARD_EVENT_CATEGORY.toLowerCase()) {
    const dateFromDay = item.startDate.getDate();
    const dateFromMonth = monthNames[item.startDate.getMonth()].substr(0, 3); // get rid of the dot
    div.innerHTML = div.innerHTML
      .replace(/\$\{dateFromDay\}/g, dateFromDay)
      .replace(/\$\{dateFromMonth\}/g, dateFromMonth);

    if (item.endDate) {
      const dateToDay = item.endDate.getDate();
      const dateToMonth = monthNames[item.endDate.getMonth()].substr(0, 3); // get rid of the dot
      div.innerHTML = div.innerHTML.replace(/\$\{dateToDay\}/g, dateToDay).replace(/\$\{dateToMonth\}/g, dateToMonth);
    }
  }

  return div.innerHTML;
}

/**
 * Update overview
 */

function updateOverview() {
  // get search parameters from select elements
  for (var i = 0, l = $$filters.length; i < l; i++) {
    var $input = $$filters[i].querySelector(".js-filter-select__input");
    params.set($input.name, $input.value);
  }

  // get extra search params
  var extraParams = new URLSearchParams();
  if ($$params) {
    for (var ii = 0, ll = $$params.length; ii < ll; ii++) {
      extraParams.set($$params[ii].name, $$params[ii].value);
    }
  }

  // get url from data-attribute and add params
  var url = $content.dataset.url + "?" + params.toString() + "&" + extraParams.toString();

  $container.classList.add(constants.CLASS_LOADING);

  fetch(url)
    .then(function(response) {
      if (response.status >= 200 && response.status < 300) {
        return response;
      } else {
        var error = new Error(response.statusText);
        error.response = response;
        throw error;
      }
    })
    .then(function(response) {
      return response.text();
    })
    .then(function(text) {
      var response = JSON.parse(text);

      if (response.featured !== null || response.items !== null) {
        var gridContent = "";

        if (response.featured !== null && response.featured.length > 0) {
          response.featured.forEach(function(item) {
            gridContent = gridContent + makeCard(item, CARD_FEATURED_TEMPLATE.content);
          });
        }

        if (response.items !== null && response.items.length > 0) {
          response.items.forEach(function(item) {
            gridContent = gridContent + makeCard(item, CARD_TEMPLATE.content);
          });
        }

        $content.innerHTML = gridContent;

        // reset +more button label
        var $moreButton = $footer.querySelector(".js-meet-us-more-btn");
        $moreButton.textContent = $moreButton.dataset.defaultLabel;

        // show footer when there are more filtered items left
        if (response.showMore) {
          $footer.removeAttribute("hidden");
        } else {
          $footer.setAttribute("hidden", true);
        }

        // run polyfill for pictures
        window.picturefill();
      } else {
        // no items, show empty template
        $content.innerHTML = "";
        var card = document.importNode(EMPTY_TEMPLATE.content, true);
        $content.appendChild(card);
        $footer.setAttribute("hidden", true);
      }

      // clean up classes
      $container.classList.remove(constants.CLASS_ERROR);
      $container.classList.remove(constants.CLASS_LOADING);
    })
    .catch(function(error) {
      $container.classList.add(constants.CLASS_ERROR);
      $container.classList.remove(constants.CLASS_LOADING);
      $content.innerHTML = "";
      console.log(error);
    });
}

/**
 * Listen to custom filterChange event
 */

function onFilterChange(e) {
  if (findParent.byClassName(e.delegateTarget, "js-meet-us")) {
    params.set("page", 1);
    updateOverview();
    history.pushState({}, null, "?" + params.toString());
  }
}

delegate.bind(document.body, ".js-filter-select", "filterChange", onFilterChange);

/**
 * Retry click
 */

function onRetryClick() {
  updateOverview();
}

delegate.bind(document.body, ".js-meet-us-retry-btn", "click", onRetryClick);

/**
 * Reset selects to index 0
 */

function onClearClick() {
  for (var i = 0, l = $$filters.length; i < l; i++) {
    var event = document.createEvent("Event");
    event.initEvent("filterClear", true, true);
    $$filters[i].dispatchEvent(event);
  }
  params.set("page", 1);
  updateOverview();
  history.pushState({}, null, "?" + params.toString());
}

delegate.bind(document.body, ".js-meet-us-clear-btn", "click", onClearClick);

/**
 * Load more
 */

function onMoreClick(e) {
  var $btn = e.delegateTarget;
  $btn.textContent = $btn.dataset.loadLabel;
  var nextPage = parseInt(params.get("page")) + 1;
  params.set("page", nextPage);
  history.pushState({}, null, "?" + params.toString());
  updateOverview();
}

delegate.bind(document.body, ".js-meet-us-more-btn", "click", onMoreClick);

/**
 * When history changes
 */

function onPopState() {
  params = new URLSearchParams(location.search);

  Object.keys(params).forEach(function(key) {
    var value = params[key];
    var $input = $container.querySelector(".js-filter-select__input[name=" + key + "]");
    if ($input) {
      $input.value = value;
      var event = document.createEvent("Event");
      event.initEvent("filterValueChanged", true, true);
      $input.dispatchEvent(event);
    }
  });

  updateOverview();
}

window.addEventListener("popstate", onPopState);

/**
 * Things to do on page load
 */

function setup() {
  if (params.get("page") === null) {
    params.set("page", 1);
  }

  for (var i = 0, l = $$filters.length; i < l; i++) {
    var $input = $$filters[i].querySelector(".js-filter-select__input");
    var str = params.get($input.name);
    if (str !== null) {
      $input.value = str;
    }
  }

  updateOverview();
}

if ($container) {
  setup();
}
