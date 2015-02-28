module.exports = {
    entry: "./js/main.js",
    devtool: "#source-map",
    output: {
        path: "./build/",
        filename: "bundle.js",
        sourceMapFilename: "[file].map",
        publicPath: "http://localhost:8094/assets"
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
