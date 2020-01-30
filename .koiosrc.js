const S = require("path").sep;

/**
 * Paths
 */

const paths = {
  SRC: { root: `source${S}` },
  DST: { root: `build${S}` },
  EXP: { root: `export${S}` }
};

// Source paths
paths.SRC.styles = `${paths.SRC.root}styles${S}`;
paths.SRC.scripts = `${paths.SRC.root}scripts${S}`;
paths.SRC.data = `${paths.SRC.root}data${S}`;

paths.SRC.templates = `${paths.SRC.root}templates${S}`;
paths.SRC.pages = `${paths.SRC.templates}pages${S}`;
paths.SRC.components = `${paths.SRC.templates}components${S}`;

// Destination paths
paths.DST.assets = `${paths.DST.root}assets${S}`;
paths.DST.styles = `${paths.DST.assets}css${S}`;
paths.DST.scripts = `${paths.DST.assets}js${S}`;

paths.DST.pages = `${paths.DST.root}`;
paths.DST.components = `${paths.DST.root}components${S}`;
paths.DST.icons = paths.DST.components;

// Static items
paths.DST.static = `${paths.DST.root}static${S}`;

// Path locals
paths.locals = {
  CSS_URL: "/assets/css/",
  JS_URL: "/assets/js/",
  IMG_URL: "/static/images/",
  FONTS_URL: "/static/fonts/",
  VIDEOS_URL: "/static/video/",
  TEMPLATES_PATH: paths.SRC.templates
};

module.exports.paths = paths;

/**
 * Locals
 */

module.exports.locals = Object.assign(
  {
    version: process.env.npm_package_version,
    imageSizes: require(`${process.cwd()}${S}${
      paths.SRC.data
    }image-sizes.json`),
    dataMeetUs: require(`${process.cwd()}${S}${
      paths.SRC.data
    }maak-kennis-items.json`),
    SLIM: "slim",
    WIDE: "wide",
    FULL: "full",
    TOP: "top",
    BOTTOM: "bottom",
    IMAGE: "image",
    IMGIX_URL: "https://eightmedia-werkenbij-rijkswaterstaat.imgix.net/",
    TESTIMONIAL: "testimonial",
    BUTTON: "button",
    STRONGLINK: "stronglink",
    VIDEO: "video",
    PODCAST: "podcast",
    GALLERY: "gallery",
    NEWS: "news",
    EVENT: "evenement",
    ARTICLE: "artikel"
  },

  paths.locals
);

/**
 * Html template for components
 */

module.exports.htmlComponent = `<!DOCTYPE html>
<html style="margin: 0; padding: 0px;">

<head>
  <base target="_blank">
  <title>{{title}}</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script source="https://cdnjs.cloudflare.com/ajax/libs/iframe-resizer/4.2.9/iframeResizer.contentWindow.min.js"></script>
  <script>(function templatePolyfill() { if ("content" in document.createElement("template")) { return false } var templates = document.getElementsByTagName("template"); var plateLen = templates.length; for (var x = 0; x < plateLen; ++x) { var template = templates[x]; var content = template.childNodes; var fragment = document.createDocumentFragment(); while (content[0]) { fragment.appendChild(content[0]) } template.content = fragment } })();</script>
  <link rel='shortcut icon' href='/static/images/favicons/favicon.ico' />
  <link rel='stylesheet' href='/assets/css/all.v${process.env.npm_package_version}.css' />
  <style>
  template {
    display: none !important;
  }
  html, body {
    background-color: white;
  }
  hr.demo {
    border-color: #ddd;
    border-style: dashed;
    margin: 30px 0;
  }
  .section:first-of-type,
  hr.demo + .section {
    margin-top: 0;
  }
  </style>
</head>

<body style="margin: 0px; padding: 0px;">
  <script source='/assets/js/lib.v${process.env.npm_package_version}.js'></script>
  <script source='/assets/js/app.v${process.env.npm_package_version}.js'></script>
  <script>
  var xhr=new XMLHttpRequest;xhr.open("GET","/components/_symbols.html",!0),xhr.onreadystatechange=function(){4===xhr.readyState&&200===xhr.status&&document.body.insertAdjacentHTML("afterbegin",xhr.responseText)},xhr.send();
  </script>
  {{output}}
</body>

</html>`;