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
              [
                "@babel/preset-env",
                { useBuiltIns: "usage", modules: false, corejs: 3 }
              ],
              "@babel/preset-react"
            ]
          }
        }
      }
    ]
  }
};