# Koios taskrunner

## Configuration

```JS
/*
 * Package
 */

module.exports.package = require("./package.json");

/**
 * Paths
 */

module.exports.paths = {
  roots: {
    from: "source",
    to: "build",
  },
  assets: {
    "static/": "static/",
    "changelog/": "changelog/",
    "docs/.vuepress/dist/": "docs/",
  },
  pages: {
    "templates/pages/**/*.pug": "${dir}/${name}.html",
    "templates/icons/_symbols.pug": "assets/icons.v${version}.html",
    "!templates/pages/**/_*.pug": null,
  },
  parts: {
    "templates/components/**/*.pug": "components/${name}.html",
    "!templates/components/**/_*.pug": null,
  },
  scripts: {
    "scripts/*.js": "assets/js/${name}.v${version}.js",
    "api/*.js": "functions/${name}.js",
  },
  styles: {
    "styles/*.scss": "assets/css/${name}.v${version}.css",
  },
  locals: {
    CSS_URL: "/assets/css/",
    JS_URL: "/assets/js/",
    IMG_URL: "/static/images/",
    FONTS_URL: "/static/fonts/",
    VIDEOS_URL: "/static/video/",
    TEMPLATES_PATH: "/templates/",
  },
};

/**
 * Locals
 */

module.exports.locals = Object.assign(
  {},
  {
    version: this.package.version,
    imageSizes: require(`${process.cwd()}/source/data/image-sizes.json`),
    dataMeetUs: require(`${process.cwd()}/source/data/maak-kennis-items.json`),
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
    ARTICLE: "artikel",
  },

  this.paths.locals
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
  <script src="https://cdnjs.cloudflare.com/ajax/libs/iframe-resizer/3.6.0/iframeResizer.contentWindow.min.js"></script>
  <script>(function templatePolyfill() { if ("content" in document.createElement("template")) { return false } var templates = document.getElementsByTagName("template"); var plateLen = templates.length; for (var x = 0; x < plateLen; ++x) { var template = templates[x]; var content = template.childNodes; var fragment = document.createDocumentFragment(); while (content[0]) { fragment.appendChild(content[0]) } template.content = fragment } })();</script>
  <link rel='shortcut icon' href='/static/images/favicons/favicon.ico' />
  <link rel='stylesheet' href='${this.paths.locals.CSS_URL}all.v${this.package.version}.css' />
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
  <script source='${this.paths.locals.JS_URL}lib.v${this.package.version}.js'></script>
  <script source='${this.paths.locals.JS_URL}app.v${this.package.version}.js'></script>
  <script>
  var xhr=new XMLHttpRequest;xhr.open("GET","/assets/icons.v${this.package.version}.html",!0),xhr.onreadystatechange=function(){4===xhr.readyState&&200===xhr.status&&document.body.insertAdjacentHTML("afterbegin",xhr.responseText)},xhr.send();
  </script>
  {{output}}
</body>

</html>`;

/*
 * Robots.txt to add to destination folder
 */

module.exports.robotsTxt = `User-agent: *
Disallow: /
`;
```

## Scripts
Scripts are analyzed with ESLint and bundled by Webpack. Both follow a default setup inside Koios, but can be easily configured for your specific needs. Provide the entry points in `paths.scripts` inside `.koiosrc`, for example:

```
module.exports.paths = {
  roots: {
    from: "source",
    to: "build",
  },
  scripts: {
    "scripts/*.js": "assets/js/${name}.v${version}.js",
    "api/*.js": "functions/${name}.js",
  },
}
```

According to this configuration Koios will build all entries matching the patterns `/source/scripts/*.js` and `/source/api/*.js`.

### ESLint
If NODE_ENV=development, scripts are analyzed with ESLint. By default ESLint is configured as follows:

```JS
{ 
  baseConfig: {
    "env": {
      "browser": true,
      "node": true
    },
    "parser": require.resolve("babel-eslint"),
    "extends": [
      "eslint:recommended"
    ],
    "rules": {
      "global-require": 1,
      "no-mixed-requires": 1
    },
    "globals": {
      "window": true,
      "document": true
    }
  }
}
```

#### Custom configuration
Add a file called `.eslintrc` inside the directory you wish to customize. For example, if you want ESLint to parse a react app inside `/source/scripts/vacancies/`, put the configuration file in that same directory:

```JS
{
  "extends": [
    "plugin:react/recommended"
  ],
  "rules": {
    "react/prop-types": 0
  },
  "settings": {
    "react": {
      "version": "detect"
    }
  }
}
```

### Webpack
By default Webpack is configured to bundle CommonJS modules for the web:

```JS
{
  target: "web",
  module: {
    rules: [
      {
        test: /\.(js)$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: [
              ["@babel/preset-env", { modules: "cjs", useBuiltIns: "usage", corejs: 3 }]
            ]
          }
        }
      }
    ]
  }
}
```

#### Customize for a single entry
If you want to customize the webpack configuration for a single entry called `vacancies.js`, add a file called `vacancies.webpack.js` alongside the main entry. This can be useful to bundle react apps:

```JS
module.exports = {
  module: {
    rules: [
      {
        test: /\.(js)$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            plugins: ["@babel/plugin-transform-runtime"],
            presets: [
              "@babel/preset-react",
              ["@babel/preset-env", { useBuiltIns: "entry", corejs: 3 }],
            ],
          },
        },
      },
    ],
  },
};
```

#### Customize for an entire directory
Add a file called `webpack.config.js` to the directory containing the entries that require custom configuration. For example, if you have a directory `/source/api/` containing netlify functions, add the following `webpack.config.js` to that same directory:

```JS
module.exports = {
  target: "node",
  resolve: {
    mainFields: ["module", "main"],
  },
  output: {
    libraryTarget: "commonjs",
  },
  module: {
    rules: [
      {
        test: /\.(js)$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: [["@babel/preset-env", { targets: { node: "current" } }]],
          },
        },
      },
    ],
  },
};
```

## Styles
Styles (scss) are analyzed with Stylelint, parsed with node-sass and minified using cssnano (PostCSS).