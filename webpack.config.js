const path = require('path');
const webpack = require('webpack');

// many of the webpack directives need an absolute path
const basedir = path.resolve(__dirname, './');

module.exports = {
  plugins: [
    new webpack.DefinePlugin({ APP_VERSION: JSON.stringify(require(path.resolve(basedir, 'package.json')).version) }),
  ],
  module: {
    rules: [
      {
        test: /\.scss$/,
        use: ["style-loader","css-loader", "sass-loader"]
      },
      {
        test:/\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader"
        }
      }
    ]
  }
}
