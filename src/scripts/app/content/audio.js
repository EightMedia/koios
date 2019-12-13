var delegate = require("delegate-events");
var findParent = require("find-parent");

var constants = require("../constants");

/**
 * Panes (download, read transcript)
 */

function openPane($pane) {
  $pane.classList.remove(constants.CLASS_CLOSED);
  $pane.classList.add(constants.CLASS_OPEN);
  $pane.removeAttribute("hidden");
}

function closePane($pane) {
  $pane.classList.remove(constants.CLASS_OPEN);
  $pane.classList.add(constants.CLASS_CLOSING);
  $pane.addEventListener("animationend", afterClosePane);
}

function afterClosePane(e) {
  var $pane = e.target;
  $pane.classList.remove(constants.CLASS_CLOSING);
  $pane.classList.add(constants.CLASS_CLOSED);
  $pane.setAttribute("hidden", true);
  $pane.removeEventListener("animationend", afterClosePane);
}

function closeAll($audio) {
  var $$panes = $audio.querySelectorAll(".js-audio-pane.is-open");

  for (var i = 0, l = $$panes.length; i < l; i++) {
    closePane($$panes[i]);
  }
}

function toggleClick(e) {
  var $toggle = e.delegateTarget;
  var $audio = findParent.byClassName($toggle, "js-audio");
  var $pane = $audio.querySelector(".js-audio-pane-" + $toggle.dataset.pane);

  if (!$pane.classList.contains(constants.CLASS_OPEN)) {
    closeAll($audio);
    openPane($pane);
  } else {
    closePane($pane);
  }
}

delegate.bind(document.body, ".js-audio-pane-toggle", "click", toggleClick);

/**
 * Download transcript from url set in data-transcript-txt
 */

function downloadTranscript($transcript) {
  if (!$transcript || !$transcript.dataset.transcriptTxt) return;

  var xhr = new XMLHttpRequest();
  xhr.open("GET", $transcript.dataset.transcriptTxt, !0),
    (xhr.onreadystatechange = function() {
      4 === xhr.readyState &&
        200 === xhr.status &&
        $transcript.insertAdjacentHTML("afterbegin", xhr.responseText.replace(/\n/g, "<br>"));
    }),
    xhr.send();
}

/**
 * Add duration label
 */

function addDurationLabel($container) {
  var $audioEl = $container.querySelector("audio");
  var $label = document.createElement("span");
  $label.classList.add("vjs-rws-skin__duration");

  $audioEl.onloadedmetadata = function() {
    var minutes = Math.floor($audioEl.duration / 60);
    var seconds = Math.floor($audioEl.duration % 60);
    var audioDuration = str_pad_left(minutes, "0", 2) + ":" + str_pad_left(seconds, "0", 2);
    $label.textContent = audioDuration;
  };

  window.RWS.videojs($audioEl).ready(function() {
    var $playButton = $container.querySelector(".vjs-big-play-button");
    $playButton.appendChild($label);
  });
}

function str_pad_left(string, pad, length) {
  return (new Array(length + 1).join(pad) + string).slice(-length);
}

/**
 * Do stuff on page load
 */

var $$audioContainers = document.querySelectorAll(".js-audio");

for (var i = 0, l = $$audioContainers.length; i < l; i++) {
  var $container = $$audioContainers[i];

  // download transcript when data-transcript-txt is set
  downloadTranscript($container.querySelector(".js-audio-pane-transcript"));

  // add span to big play button with duration of audio
  addDurationLabel($container);
}
