
module.exports = {
    module: {
        rules: [
            {
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader"
                }
            }
        ]
    }
}