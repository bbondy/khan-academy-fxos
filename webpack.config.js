var path = require("path");

module.exports = {
    cache: true,
    entry: "./js/main.js",
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
                  /bower_components\/MathJax/,
                  /bower_components\/KAS/,
                  /node_modules\/underscore/],
        loaders: [
            {
                //tell webpack to use jsx-loader for all *.jsx files
                test: /\.js$/,
                loader: "regenerator-loader"
            },
            {
                //tell webpack to use jsx-loader for all *.jsx files
                test: /\.js$/,
                loader: "jsx-loader?insertPragma=React.DOM&harmony&stripTypes"
            }
        ],
    },
    resolve: {
        alias: {
            "react": path.resolve("node_modules/react/dist/react.js"),
            "underscore": path.resolve("node_modules/underscore/underscore-min.js"),
            "jquery": path.resolve("node_modules/jquery/dist/jquery.min.js"),
            "katex": path.resolve("bower_components/katex/build/katex.min.js"),
        },
        extensions: ["", ".js", ".jsx"]
    }
}
