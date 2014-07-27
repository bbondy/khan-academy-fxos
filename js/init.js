require.config({
    baseUrl: 'js/lib',
    paths: {
        "react": "../react",
        "JSXTransformer": "../JSXTransformer",
        "jsx": "../jsx",
        "text": "../text",
        "main": "../main",
        "models": "../models",
        "underscore": "../underscore-min",
        "jquery": "../jquery",
        "backbone": "../backbone"
    }
});

requirejs(['backbone', 'react', 'jsx!main']);
