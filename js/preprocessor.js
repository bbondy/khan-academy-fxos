// preprocessor.js
var ReactTools = require("react-tools"),
    es6defaultParams = require("es6-default-params"),
    regenerator = require("regenerator");

module.exports = {
    process: function(src) {
        src = es6defaultParams.compile(src).code;
        // Regenerator has a bug when using backbone
        if (src.indexOf("\"enable_regenerator\"") !== -1) {
            src = regenerator.compile(src, {
                includeRuntime: true
            }).code;
        }
        src = ReactTools.transform(src, {
            stripTypes: true,
            harmony: true
        });
        return src;
    }
};
