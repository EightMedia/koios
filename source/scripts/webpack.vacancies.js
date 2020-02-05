module.exports = {
  module: {
    rules: [
      {
        test: /\.(js)$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            plugins: [
              "@babel/plugin-transform-runtime"
            ],
            presets: [
              "@babel/preset-react",
              ["@babel/preset-env", { useBuiltIns: "entry", corejs: 3 }]
            ]
          }
        }
      }
    ]
  }
};