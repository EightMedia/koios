var ie = require("ie-version");

if (ie.version !== null) {
  document.documentElement.className += "old-ie ie" + ie.version;

  if (ie.version !== 11) {
    var $browsehappy = document.createElement("div");
    $browsehappy.className = "browsehappy";
    $browsehappy.innerHTML = window.OLDIE_MESSAGE;
    document.body.appendChild($browsehappy);
    $browsehappy.addEventListener("click", function() {
      this.parentNode.removeChild(this);
    });
  }
}
