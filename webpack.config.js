module.exports = {
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
