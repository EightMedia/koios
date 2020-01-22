var delegate = require("delegate-events");
var findParent = require("find-parent");

var constants = require("../constants");

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

function closeAll($video) {
  var $$panes = $video.querySelectorAll(".js-video-pane.is-open");

  for (var i = 0, l = $$panes.length; i < l; i++) {
    closePane($$panes[i]);
  }
}

function toggleClick(e) {
  var $toggle = e.delegateTarget;
  var $video = findParent.byClassName($toggle, "js-video");
  var $pane = $video.querySelector(".js-video-pane-" + $toggle.dataset.pane);

  if (!$pane.classList.contains(constants.CLASS_OPEN)) {
    closeAll($video);
    openPane($pane);
  } else {
    closePane($pane);
  }
}

delegate.bind(document.body, ".js-video-pane-toggle", "click", toggleClick);

/**
 * Read transcript
 */

function downloadTranscript($transcript) {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", $transcript.dataset.transcriptTxt, !0),
    (xhr.onreadystatechange = function() {
      4 === xhr.readyState &&
        200 === xhr.status &&
        $transcript.insertAdjacentHTML("afterbegin", xhr.responseText.replace(/\n/g, "<br>"));
    }),
    xhr.send();
}

var $$transcripts = document.querySelectorAll(".js-video-pane-transcript");
for (var i = 0, l = $$transcripts.length; i < l; i++) {
  var $transcript = $$transcripts[i];

  if (!$transcript.dataset.transcriptTxt) {
    continue;
  }

  downloadTranscript($transcript);
}
