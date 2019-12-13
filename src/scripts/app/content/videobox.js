var delegate = require("delegate-events");
var focusTrap = require("../ui/focus-trap");
var bodyScrollLock = require("body-scroll-lock");
var constants = require("../constants");

var $vbContainer = document.querySelector(".js-videobox");

var vjsSetup = require("./video-js-setup");

if ($vbContainer) {
  var $vbTitle = $vbContainer.querySelector(".js-videobox-title");
  var $vbPlayer = $vbContainer.querySelector(".video-js");
}

/**
 * Open videobox
 */

function open(id) {
  var vjsPlayer = window.RWS.videojs($vbPlayer);
  var audioDescription = $vbContainer.querySelector(".vjs-audio-track");
  var $link = document.querySelector('a[href="#' + id + '"]');

  if (!$link || !$link.dataset.videobox) {
    return;
  }

  var videoData = JSON.parse($link.dataset.videobox);

  if (!videoData) {
    return;
  }

  // set title
  if (videoData.title) {
    $vbTitle.textContent = videoData.title;
  } else {
    $vbTitle.textContent = "undefined";
  }

  // set video
  vjsPlayer.src(videoData.url);

  // set audio when present
  if (videoData.audio) {
    audioDescription.src = videoData.audio;
    vjsSetup.setupAudioDescription(vjsPlayer);
  }

  // set captions
  if (videoData.captions) {
    vjsPlayer.addRemoteTextTrack(
      { kind: "captions", src: videoData.captions, label: "standaard", default: true },
      true
    );
  }

  // pause other videos
  pauseContentVideos();

  // unhide
  $vbContainer.removeAttribute("hidden");

  // set open
  $vbContainer.classList.add(constants.CLASS_OPEN);
  $vbContainer.classList.remove(constants.CLASS_CLOSED);
  document.body.classList.add(constants.CLASS_MODAL_OPEN + "--videobox");

  // store current focus
  focusTrap.setReturnFocus();

  // listen to keyboard
  document.addEventListener("keydown", onKeyDown, false);

  // trap focus inside element
  $vbContainer.setAttribute("tabindex", "-1");
  focusTrap.enable($vbContainer, $vbContainer);

  // disable body scroll
  bodyScrollLock.disableBodyScroll();

  // play video
  vjsPlayer.play();
}

/**
 * Close videobox
 */

function close() {
  var vjsPlayer = window.RWS.videojs($vbPlayer);
  var audioDescription = $vbContainer.querySelector(".vjs-audio-track");

  // reset video
  vjsPlayer.reset();

  // clear audio
  vjsSetup.clearAudioDescription(vjsPlayer);
  audioDescription.src = "";

  // enable body scroll
  bodyScrollLock.enableBodyScroll();

  focusTrap.disable();

  // stop listening for keydown
  document.removeEventListener("keydown", onKeyDown);

  // not open
  $vbContainer.classList.remove(constants.CLASS_OPEN);
  $vbContainer.classList.add(constants.CLASS_CLOSING);

  // final close after animation ends
  $vbContainer.addEventListener("animationend", afterClose);
}

/**
 * After close animation
 */

function afterClose(e) {
  var $vbContainer = e.target;
  $vbContainer.classList.remove(constants.CLASS_CLOSING);
  $vbContainer.classList.add(constants.CLASS_CLOSED);
  document.body.classList.remove(constants.CLASS_MODAL_OPEN + "--videobox");

  // hide
  $vbContainer.setAttribute("hidden", true);

  // stop listening
  $vbContainer.removeEventListener("animationend", afterClose);
}

/**
 * Listen for show button clicks
 */

function onOpenButtonClick(e) {
  var $btn = e.delegateTarget;
  var rel = $btn.getAttribute("aria-controls");

  if (rel) {
    open(rel);
    setHash(rel);
  }
}

delegate.bind(document.body, ".js-videobox-open", "click", onOpenButtonClick);

/**
 * Listen to close button
 */

function onCloseButtonClick(e) {
  var $btn = e.delegateTarget;
  var rel = $btn.getAttribute("aria-controls");
  if (rel) {
    close(rel);
    removeHash();
  }
}

delegate.bind(document.body, ".js-videobox-close", "click", onCloseButtonClick);

/**
 * Close on escape press
 */

function onKeyDown(e) {
  if (e.which === constants.KEY_ESCAPE) {
    close();
    removeHash();
  }
}

/**
 * Listen to anchor links
 */

function onAnchorLinkClick(e) {
  // check if it's an internal link
  var $target = e.delegateTarget;
  var href = $target.getAttribute("href");
  if (href.indexOf("#") !== 0) {
    return;
  }

  // check if it wants a videobox
  var url = $target.dataset.videobox;
  if (!url) {
    return;
  }

  // prevent reload and set hash
  e.preventDefault();
  setHash(href.substring(1));

  // open videobox
  open(href.substring(1));
}

delegate.bind(document.body, "a", "click", onAnchorLinkClick);

/**
 * Try opening when location contains hash
 */

if (location.hash) {
  try {
    open(location.hash.substring(1));
  } catch (err) {
    console.log(err);
  }
}

/**
 * On pop state
 */

function setHash(id) {
  history.pushState(null, "", "#" + id);
}

function removeHash() {
  history.pushState(null, "", window.location.pathname);
}

function onPopState() {
  if (!location.hash) {
    close();
    return;
  } else {
    open(location.hash.substring(1));
  }
}

window.addEventListener("popstate", onPopState);

/**
 * Pause videos
 */

function pauseContentVideos() {
  var $$vbPlayers = document.querySelectorAll(".main video");

  for (var i = 0, l = $$vbPlayers.length; i < l; i++) {
    var $vbPlayer = $$vbPlayers[i];

    if (!$vbPlayer.currentSrc) continue;

    $vbPlayer.pause();
  }
}
