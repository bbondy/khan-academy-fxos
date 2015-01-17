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
        "react": "../bower_components/react/react-with-addons",
        //"react": "../bower_components/react/react-with-addons.min",
        "underscore": "../bower_components/underscore/underscore-min",
        "jquery": "../bower_components/jquery/dist/jquery.min",
        "backbone": "../bower_components/backbone/backbone",
        "perseus": "../webapp/javascript/perseus-package/perseus-2",
        "katex": "../bower_components/katex/build/katex.min",
        "videojs": "../bower_components/videojs/dist/video-js/video",
        "kas": "../bower_components/KAS/kas",
        "mathjax": "../bower_components/MathJax/MathJax",

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
        oauth:{
          deps: ["jquery"],
        },
        kas: {
            exports: 'KAS'
        },
        katex: {
          exports: 'katex'
        },
        perseus: {
            deps: ["react", "katex", "jquery"],
        },
        backbone: {
          deps:["underscore", "jquery"],
          exports: 'Backbone'
        },
        videojs: {
          exports: 'videojs'
        },
        mathjax: {
          exports: 'MathJax'
        },
        minify: {
          exports: 'Minify'
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

window.Exercises = {
    cluesEnabled: false
};

requirejs(initModules);
