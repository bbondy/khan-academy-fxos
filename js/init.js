require.config({
    baseUrl: '/build',
    paths: {
        "util": "util",
        "downloads": "downloads",
        "apiclient": "apiclient",
        "main": "main",
        "oauth": "oauth",
        "models": "models",
        "notifications": "notifications",
        "cache": "cache",
        "test": "../test/test",

        // Third party libs
        "text": "./lib/text",
        "react": "./lib/react-with-addons",
        "JSXTransformer": "./lib/JSXTransformer",
        "jsx": "./lib/jsx",
        "underscore": "./lib/underscore-min",
        "jquery": "./lib/jquery",
        "backbone": "./lib/backbone"
    }
});

// Uncomment to visually test localization.
// Replaces all localized strings with boxes.
//window.translateToBoxes = true;

var initModules = ['main'];
if (window.isTest) {
    initModules.push('test');
}
requirejs(initModules);

