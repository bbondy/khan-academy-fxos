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
        "sinon": "../test/sinon-1.1.0.3",

        // Third party libs
        "text": "./lib/text-min",
        "react": "./lib/react-with-addons-min",
        "jsx": "./lib/jsx-min",
        "underscore": "./lib/underscore-min",
        "jquery": "./lib/jquery-min",
        "backbone": "./lib/backbone-min"
    }
});

// Uncomment to visually test localization.
// Replaces all localized strings with boxes.
//window.translateToBoxes = true;

var initModules = ['main'];
if (window.isTest) {
    initModules.push('sinon');
    initModules.push('test');
}
requirejs(initModules);

