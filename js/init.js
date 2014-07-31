require.config({
    baseUrl: 'build',
    paths: {
        "react": "react",
        "JSXTransformer": "JSXTransformer",
        "jsx": "jsx",
        "ka": "ka",
        "text": "text",
        "main": "main",
        "oauth": "oauth",
        "models": "models",
        "underscore": "underscore-min",
        "jquery": "jquery",
        "backbone": "backbone"
    }
});

requirejs(['underscore', 'backbone', 'react', 'main']);
