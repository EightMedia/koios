var constants = require("../constants");

/**
 * Voeg audio-omschrijving toe aan video
 * Gebaseerd op https://codepen.io/MatthieuPoullin/pen/bpqXNq
 */

function setupAudioDescription(vjs) {
  // selecteer het audio-element
  var audioDescription = vjs.el_.parentElement.querySelector(".vjs-audio-track");

  // verifieer of er een audio element bestaat
  if (!audioDescription) return;

  if (audioDescription.src || audioDescription.currentSrc) {
    // voeg het knopje toe
    var ADButton = vjs.controlBar.addChild("button", {}, vjs.controlBar.children().length - 2);
    ADButton.el_.classList.add("vjs-icon-audio-description");
    ADButton.el_.setAttribute("title", "Audio-omschrijving");

    // definieer het volumeverschil
    var ratioVolume = 0.3;

    // volume afstemmen
    audioDescription.volume = 0;
    vjs.volume(ratioVolume);

    // voeg de klikactie aan het knopje toe
    ADButton.on("click", function() {
      if (audioDescription.volume) {
        audioDescription.volume = 0;
        ADButton.el_.classList.remove(constants.CLASS_ACTIVE);
      } else {
        audioDescription.volume = Math.min(vjs.volume() + ratioVolume, 1);
        ADButton.el_.classList.add(constants.CLASS_ACTIVE);
      }
    });

    // synchroniseer afspelen
    var vjsPlay = function() {
      if (audioDescription.paused) {
        audioDescription.play();
      }
    };
    vjs.on("play", vjsPlay);

    // synchroniseer pauzeren
    var vjsPause = function() {
      if (!audioDescription.paused) {
        audioDescription.pause();
      }
    };
    vjs.on("pause", vjsPause);

    // synchroniseer afspeeleinde
    var vjsEnded = function() {
      this.pause();
      audioDescription.pause();
    };
    vjs.on("ended", vjsEnded);

    // synchroniseer volume
    var vjsVolumeChange = function() {
      if (audioDescription.volume) {
        audioDescription.volume = Math.min(vjs.volume() + ratioVolume, 1);
      }
    };
    vjs.on("volumechange", vjsVolumeChange);

    // synchroniseer afspeelmoment
    var vjsTimeUpdate = function() {
      if (audioDescription.readyState >= 4) {
        if (Math.ceil(audioDescription.currentTime) != Math.ceil(vjs.currentTime())) {
          audioDescription.currentTime = vjs.currentTime();
        }
      }
    };
    vjs.on("timeupdate", vjsTimeUpdate);
  }
}

module.exports.setupAudioDescription = setupAudioDescription;

/**
 * Clear audio description
 */

function clearAudioDescription(vjs) {
  var audioDescription = vjs.el_.parentElement.querySelector(".vjs-audio-track");
  audioDescription.pause();

  vjs.controlBar.removeChild("button");
  vjs.off("play", "vjsPlay");
  vjs.off("pause", "vjsPause");
  vjs.off("ended", "vjsEnded");
  vjs.off("volumechange", "vjsVolumeChange");
  vjs.off("timeupdate", "vjsTimeUpdate");
}

module.exports.clearAudioDescription = clearAudioDescription;

/**
 * Collect and setup videos
 */

var $$videos = document.querySelectorAll(".video-js");
var vjsOptions = { aspectRatio: "16:9", fluid: true, language: "nl" };

for (var i = 0, l = $$videos.length; i < l; i++) {
  window.RWS.videojs($$videos[i], vjsOptions, function() {
    setupAudioDescription(this);
  });
}
