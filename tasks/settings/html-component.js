module.exports = `<!DOCTYPE html>
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
  var xhr=new XMLHttpRequest;xhr.open("GET","/assets/images/_symbols.v${process.env.npm_package_version}.html",!0),xhr.onreadystatechange=function(){4===xhr.readyState&&200===xhr.status&&document.body.insertAdjacentHTML("afterbegin",xhr.responseText)},xhr.send();
  </script>
  {{output}}
</body>

</html>`;