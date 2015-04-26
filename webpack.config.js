var path = require("path");

module.exports = {
    cache: true,
    entry: "./src/main.js",
    //devtool: "#eval-source-map",
    devtool: "#source-map",
    output: {
        path: path.resolve("./build"),
        filename: "bundle.js",
        sourceMapFilename: "[file].map",
        publicPath: "/build/",
        stats: { colors: true },
    },
    module: {
        noParse: [/node_modules\/react/,
                  /node_modules\/jquery/,
                  /bower_components/,
                  /node_modules\/underscore/],
        loaders: [
            {
                test: /\.js?$/,
                exclude: [
                    /node_modules/,
                    /bower_components/,
                    /khan-exercises/,
                    /\.min.js$/,
                ],
                loader: 'babel-loader?stage=0&optional=runtime'
            }
        ],
    },
    resolve: {
        alias: {
            // The with-addons is only needed for perseus :(
            "react": path.resolve("node_modules/react/dist/react-with-addons.js"),
            "underscore": path.resolve("node_modules/underscore/underscore-min.js"),
            "jquery": path.resolve("node_modules/jquery/dist/jquery.min.js"),
            "katex": path.resolve("bower_components/katex/build/katex.min.js"),
        },
        extensions: ["", ".js", ".jsx"]
    }
}
