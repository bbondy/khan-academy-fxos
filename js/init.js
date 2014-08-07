require.config({
    baseUrl: '/build',
    paths: {
        "react": "react-with-addons",
        "JSXTransformer": "JSXTransformer",
        "jsx": "jsx",
        "ka": "ka",
        "text": "text",
        "main": "main",
        "oauth": "oauth",
        "models": "models",
        "underscore": "underscore-min",
        "jquery": "jquery",
        "backbone": "backbone",
        "test": "../test/test"
    }
});

var initModules = ['underscore', 'backbone', 'react', 'main'];
if (window.isTest) {
    initModules.push('test');
}
requirejs(initModules);
