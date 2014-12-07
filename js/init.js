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
        "test-react": "../test/test-react",
        "sinon": "../test/sinon-1.1.0.3",

        // Third party libs
        "text": "./lib/text-min",
        "react": "./lib/react-with-addons-min",
        "react-dev": "./lib/react-with-addons-dev",
        "jsx": "./lib/jsx-min",
        "underscore": "./lib/underscore-min",
        "jquery": "./lib/jquery-min",
        "backbone": "./lib/backbone-min"
    }
});

// Uncomment to visually test localization.
// Replaces all localized strings with boxes.
//window.translateToBoxes = true;

var initModules = [];
if (window.isTest) {
    initModules.push('test-react');
    initModules.push('test');
    initModules.push('sinon');
} else {
    initModules.push('main');
}
requirejs(initModules);

