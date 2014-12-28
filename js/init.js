require.config({
    baseUrl: '/build',
    paths: {
        // Modules
        "util": "util",
        "downloads": "downloads",
        "apiclient": "apiclient",
        "main": "main",
        "oauth": "oauth",
        "models": "models",
        "notifications": "notifications",
        "cache": "cache",

        // Modules to test the app
        "test": "../test/test",
        "test-react": "../test/test-react",
        "sinon": "../test/sinon-1.1.0.3",

        // Third party libs
        "text": "./lib/text-min",
        //"react": "./lib/react-with-addons-min",
        "react": "./lib/react-with-addons-dev",
        "jsx": "./lib/jsx-min",
        "underscore": "./lib/underscore-min",
        "jquery": "./lib/jquery-min",
        "backbone": "./lib/backbone-min",
        "perseus": "../webapp/javascript/perseus-package/perseus-2",
        "katex": "./lib/katex",

        // Views
        "article": "./views/article",
        "exercise": "./views/exercise",
        "chrome": "./views/chrome",
        "search": "./views/search",
        "topic": "./views/topic",
        "video": "./views/video",
        "pane": "./views/pane",
    },
    shim: {
        jquery: {
          exports: '$'
        },
        underscore: {
          deps: ["jquery"],
          exports: '_'
        },
        perseus: {
            deps: ["react", "katex", "jquery"],
        },
        backbone: {
          deps:["underscore", "jquery"],
          exports: 'Backbone'
        },
        waitSeconds: 15
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

window.Khan = {};
window.KhanUtil = Khan.KhanUtil = {};
window.Exercises = {
    cluesEnabled: false
};

// Localization shim within perseus, we want to do nothing for it
// since we aren't repsonsible for its localization
//$._ = function(x) { return x; };

requirejs(initModules);
