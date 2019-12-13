var lory = require("lory.js").lory;
var findParent = require("find-parent");
var dispatcher = require("../dispatcher");
var constants = require("../constants");
var breakpoint = require("../ui/breakpoint");

/**
 * Setup slider slider for mobile viewports
 * Used lory (http://meandmax.github.io/lory/)
 */

var sliderInstances = [];

function setup(e) {
  var $$sliders = document.querySelectorAll(".js-carousel");

  for (var i = 0, l = $$sliders.length; i < l; ++i) {
    var $slider = $$sliders[i];

    // first destroy the slider after breakpoint change
    if (e && e.type === constants.EVENT_BREAKPOINT_CHANGE) {
      destroy($slider);
    }

    // check if more than 1 slide
    if ($slider.querySelectorAll(".js-carousel-slide").length <= 1) {
      continue;
    }

    // add listeners to slideshow
    $slider.addEventListener("after.lory.slide", onSlide);
    $slider.addEventListener("on.lory.resize", onResize);
    $slider.addEventListener("on.lory.touchstart", onTouchStart);
    $slider.addEventListener("touchmove", onTouchMove);
    $slider.addEventListener("on.lory.touchend", onTouchEnd);
    $slider.addEventListener("click", onClick);

    // initiate settings
    var settings = {
      enableMouseEvents: true,
      classNameFrame: "js-carousel-frame",
      classNameSlideContainer: "js-carousel-viewport",
      classNamePrevCtrl: "js-carousel-prev",
      classNameNextCtrl: "js-carousel-next",
      infinite: 0
    };

    // save original slides before lory initiates,
    // so we can set the tabindex on them after lory initiates
    var $$originalSlides = $slider.querySelectorAll(".js-carousel-slide");

    // setup slider
    var sliderInstance = lory($slider, settings);

    // set tabindex to 0 on original slides
    // to prevent tabbing on cloned slides by lory
    for (var ii = 0, ll = $$originalSlides.length; ii < ll; ii++) {
      var $lastSlide = $$originalSlides[ii].querySelector(".explore-card--last");
      if (!$lastSlide) {
        $$originalSlides[ii].setAttribute("tabindex", "0");
      } else {
        var $$btns = $lastSlide.querySelectorAll(".link-btn");
        for (var iii = 0, lll = $$btns.length; iii < lll; iii++) {
          $$btns[iii].setAttribute("tabindex", "0");
        }
      }
    }

    sliderInstance.$el = $slider;
    sliderInstance.info = { currentSlide: 0 };

    // calculate slide width
    sliderInstance.info.slideWidth = $$originalSlides[0].getBoundingClientRect().width;
    sliderInstance.info.frameWidth = $slider.querySelector(".js-carousel-frame").getBoundingClientRect().width;
    sliderInstance.info.slideAmountThatFits =
      parseInt(sliderInstance.info.frameWidth) / parseInt(sliderInstance.info.slideWidth);
    sliderInstance.info.slideAmount = $$originalSlides.length;
    sliderInstance.info.spaceLeft =
      sliderInstance.info.frameWidth -
      Math.floor(sliderInstance.info.slideAmountThatFits) * sliderInstance.info.slideWidth;
    sliderInstance.info.slidesLeft =
      parseInt(sliderInstance.info.slideAmount) -
      parseInt(sliderInstance.info.currentSlide) -
      parseFloat(sliderInstance.info.slideAmountThatFits);

    // store slider instance
    sliderInstances.push(sliderInstance);

    // slide
    onSlide({
      target: $slider,
      detail: {
        currentSlide: 0
      }
    });
  }
}

dispatcher.on(constants.EVENT_BREAKPOINT_CHANGE, setup);

setup({
  breakpoint: breakpoint.get()
});

/**
 * Check if click was being prevented by lory
 * stop event propagation if it was
 * (exclude explore-carousel)
 */

function onClick(e) {
  if (e.defaultPrevented) {
    e.preventDefault();
    e.stopPropagation();
  }
}

/**
 * Check if touch was initiated, if so: increase touchpan
 */

function onTouchStart(e) {
  e.target.classList.add(constants.TOUCH_MOVE);
}

function onTouchMove(e) {
  if (e.target.classList.contains(constants.TOUCH_MOVE)) {
    e.preventDefault();
  }
}

function onTouchEnd(e) {
  e.target.classList.remove(constants.TOUCH_MOVE);
}

/**
 * Catch resize
 * On resize lory resets to 0 but doesn't fire slide event
 * might no longer be an issue when rewindOnResize gets fixed
 */

function onResize(e) {
  var $slider = e.target;
  dispatcher.dispatch({
    type: constants.EVENT_CAROUSEL_SLIDE,
    target: $slider,
    index: 0
  });

  var instance = getInstance($slider);
  instance.info.slideWidth = $slider.querySelector(".js-carousel-slide").getBoundingClientRect().width;
  instance.info.frameWidth = $slider.querySelector(".js-carousel-frame").getBoundingClientRect().width;
  instance.info.slideAmountThatFits = parseInt(instance.info.frameWidth) / parseInt(instance.info.slideWidth);
}

/**
 * On Slide update dot navigation
 */

function onSlide(e) {
  var $slider = e.target;

  setData($slider);

  // dispatch slide event (to dot navigation)
  dispatcher.dispatch({
    type: constants.EVENT_CAROUSEL_SLIDE,
    target: $slider,
    index: e.detail.currentSlide
  });

  // store current slide value
  var sliderInstance = getInstance(e.target);

  // check if we've reached the end that fits in the viewport
  sliderInstance.info.slidesLeft =
    parseInt(sliderInstance.info.slideAmount) -
    parseInt(sliderInstance.info.spaceLeft > 0 ? sliderInstance.info.currentSlide : e.detail.currentSlide) -
    parseFloat(sliderInstance.info.slideAmountThatFits);

  var movingForward = e.detail.currentSlide >= sliderInstance.info.currentSlide;

  if (movingForward && Math.floor(sliderInstance.info.slidesLeft) === 0) {
    $slider.querySelector(".js-carousel-next").classList.add("disabled");
  } else {
    $slider.querySelector(".js-carousel-next").classList.remove("disabled");
  }

  // store current slide index
  sliderInstance.info.currentSlide = e.detail.currentSlide;
}

/**
 * Add slider data attributed based on active slide data attribute
 */

function setData($slider) {
  var $activeSlide = $slider.querySelector(".js-carousel-slide.active");
  var sliderData = $activeSlide.getAttribute("data-js-carousel-slide");
  if (sliderData) {
    $slider.setAttribute("data-slide", sliderData);
  } else {
    $slider.removeAttribute("data-slide");
  }
}

/**
 * Destroy slider
 */

function destroy($slider) {
  var instance = getInstance($slider);
  if (instance) {
    instance.$el.removeEventListener("after.lory.slide", onSlide);
    instance.$el.removeEventListener("on.lory.resize", onResize);
    instance.$el.removeEventListener("click", onClick);
    instance.destroy();
    removeInstance(instance.$el);
  }
}

/**
 * Get lory instance by element
 */

function getInstance($el) {
  var instance = null;
  for (var i = 0, l = sliderInstances.length; i < l; ++i) {
    if ($el === sliderInstances[i].$el) {
      instance = sliderInstances[i];
      break;
    }
  }
  return instance;
}

/**
 * Remove lory instance by element
 */

function removeInstance($el) {
  for (var i = 0, l = sliderInstances.length; i < l; ++i) {
    if ($el === sliderInstances[i].$el) {
      sliderInstances.splice(i, 1);
      break;
    }
  }
}

/**
 * On dot nav item click
 */

function onNavClick(e) {
  var $slider = findParent.byClassName(e.target, "js-slider");
  if (!$slider) {
    return;
  }

  var instance = getInstance($slider);
  if (instance) {
    instance.slideTo(e.index);
  }
}

dispatcher.on(constants.EVENT_SLIDERNAV_CLICK, onNavClick);
