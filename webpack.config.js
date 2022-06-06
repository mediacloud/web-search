module.exports = {
    module: {
        rules: [
            {
                externals: {
                    'react': 'React'
                },
                
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader"
                }
            }
        ]
    }
}