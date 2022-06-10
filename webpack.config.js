module.exports = {
    module: {
        rules: [
            {

                loader: 'css-loader',
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader"
                }
            }
        ]
    }
}