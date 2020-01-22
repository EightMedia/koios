var constants = require("../constants");
var delegate = require("delegate-events");
var inView = require("in-view/dist/in-view.min");
var hasLocalStorage = require("has-localstorage")();

var autoplayPreference = localStorage.getItem(constants.VIDEO_AUTOPLAY_PREFERENCE);

/**
 * Set video preferences in local storage
 */

function setLocalStorage(value) {
  if (hasLocalStorage) {
    localStorage.setItem(constants.VIDEO_AUTOPLAY_PREFERENCE, value);
  }
}

/**
 * When pause event of video fires
 */

function videoPauzed(e) {
  var $video = e.target;
  var $btn = $video.parentElement.querySelector("." + constants.CLASS_VIDEO_ACCESSIBILITY);
  $btn.classList.remove(constants.CLASS_VIDEO_ACCESSIBILITY + "--pause");
  $btn.classList.add(constants.CLASS_VIDEO_ACCESSIBILITY + "--play");
  $btn.innerHTML = '<span class="accessibility">' + constants.LABEL_PLAY + "</span>";
}

/**
 * When play event of video fires
 */

function videoPlays(e) {
  var $video = e.target;
  var $btn = $video.parentElement.querySelector("." + constants.CLASS_VIDEO_ACCESSIBILITY);
  $btn.classList.remove(constants.CLASS_VIDEO_ACCESSIBILITY + "--play");
  $btn.classList.add(constants.CLASS_VIDEO_ACCESSIBILITY + "--pause");
  $btn.innerHTML = '<span class="accessibility">' + constants.LABEL_PAUSE + "</span>";
}

/**
 * Video controls for inView
 * only pause/play when autoplay is true
 */

function videoOutView($video) {
  if ($video.hasAttribute("autoplay")) {
    $video.pause();
  }
}

function videoInView($video) {
  if ($video.hasAttribute("autoplay")) {
    $video.play();
  }
}

/**
 * Accessibility button pause/play
 */

function btnClick(e) {
  var $btn = e.target;
  var $wrap = $btn.parentElement;
  var $video = $wrap.querySelector("video");

  if ($btn.classList.contains(constants.CLASS_VIDEO_ACCESSIBILITY + "--pause")) {
    $video.pause();
    $video.removeAttribute("autoplay");
    setLocalStorage(constants.PAUSE_ALL);
  } else {
    $video.play();
    $video.setAttribute("autoplay", true);
    setLocalStorage(constants.PLAY_ALL);
  }
}

function addButton($video) {
  var $btn = document.createElement("button");
  $btn.setAttribute("type", "button");

  $btn.classList.add(constants.CLASS_VIDEO_ACCESSIBILITY);

  if (autoplayPreference === constants.PAUSE_ALL) {
    $video.removeAttribute("autoplay");
    $btn.classList.add(constants.CLASS_VIDEO_ACCESSIBILITY + "--play");
    $btn.innerHTML = '<span class="accessibility">' + constants.LABEL_PLAY + "</span>";
  } else {
    $video.setAttribute("autoplay", true);
    $btn.classList.add(constants.CLASS_VIDEO_ACCESSIBILITY + "--pause");
    $btn.innerHTML = '<span class="accessibility">' + constants.LABEL_PAUSE + "</span>";
  }

  var $wrap = $video.parentElement;
  $wrap.appendChild($btn);

  delegate.bind(document.body, "." + constants.CLASS_VIDEO_ACCESSIBILITY, "click", btnClick);
}

/**
 * Prepare video elements
 */

function initVideo() {
  var $$videos = document.querySelectorAll(".superhero video, .hero-home video, .hero-timeline video");
  for (var i = 0, l = $$videos.length; i < l; i++) {
    var $video = $$videos[i];
    $video.addEventListener("pause", videoPauzed);
    $video.addEventListener("play", videoPlays);

    $video.pause();

    // add accessibility button
    addButton($video);
  }

  // play video when it enters viewport, pause on exit
  inView.threshold(0.5);
  inView("video")
    .on("enter", videoInView)
    .on("exit", videoOutView);
}

initVideo();
