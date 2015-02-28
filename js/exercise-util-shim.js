/**
 * Shim to handle ugly stuff relating to exercise modules loaded from requirejs
 */

define(["require", "/khan-exercises/khan-exercise.js", "/bower_components/MathJax/MathJax.js"], function(require) {
    var Khan = require("/khan-exercises/khan-exercise.js");
    var MathJax = require("/bower_components/MathJax/MathJax.js");
    Khan = window.Khan;
    MathJax = window.MathJax;
    window.KhanUtil = Khan.Util;

    return {
        Khan,
        MathJax,
        KhanUtil,
    };
});
