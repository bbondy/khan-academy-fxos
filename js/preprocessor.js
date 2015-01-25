// preprocessor.js
var ReactTools = require("react-tools"),
    es6defaultParams = require("es6-default-params"),
    regenerator = require("regenerator");

module.exports = {
    process: function(src) {
        src = es6defaultParams.compile(src).code;
        src = regenerator.compile(src, {
            includeRuntime: true
        }).code;
        return ReactTools.transform(src, {
            stripTypes: true,
            harmony: true
        });
    }
};
