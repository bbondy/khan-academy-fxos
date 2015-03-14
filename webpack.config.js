//var webpack = require('webpack'),
//    ignore = new webpack.IgnorePlugin(new RegExp("^(underscore|jquery|react)$"));

module.exports = {
    entry: "./js/main.js",
    devtool: "#source-map",
    //plugins: [ignore],
    output: {
        path: require("path").resolve("./build"),
        filename: "bundle.js",
        sourceMapFilename: "[file].map",
        publicPath: "/build/",
        stats: { colors: true },
    },
    module: {
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
    externals: {
        //don't bundle the 'react' npm package with our bundle.js
        //but get it from a global 'React' variable
        "react": "React"
    },
    resolve: {
        extensions: ["", ".js", ".jsx"]
    }
}
