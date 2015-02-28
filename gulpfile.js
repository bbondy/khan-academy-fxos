var gulp = require("gulp"),
    gutil = require("gulp-util"),
    jshint = require("gulp-jshint"),
    less = require("gulp-less"),
    concat = require("gulp-concat"),
    uglify = require("gulp-uglify"),
    path = require("path"),
    shell = require("gulp-shell"),
    rename = require("gulp-rename"),
    react = require("gulp-react"),
    jsxcs = require("gulp-jsxcs"),
    jest = require("gulp-jest"),
    transform = require("vinyl-transform"),
    fs = require("fs"),
    es = require("event-stream"),
    JSONStream = require("JSONStream"),
    runSequence = require("run-sequence"),
    _ = require("underscore"),
    webpack = require("webpack");


// Lint Task
gulp.task("lint", function() {
    return gulp.src("js/**/*.js")
        .pipe(jsxcs().on("error", function(err) {
            console.log(err.toString());
        }))
        .pipe(react({
            harmony: true,
            // Skip Flow type annotations!
            stripTypes: true
        }))
        .pipe(jshint({
            esnext: true
        }))
        .pipe(jshint.reporter("default"));
});

// Compile Our LESS
gulp.task("less", function() {
    return gulp.src("./style/**/*.less")
        .pipe(less({
            paths: [ path.join(__dirname, "style") ]
        }))
        .pipe(gulp.dest("./build/css"));
});

// The react task should not normally be needed.
// This is only present if the errors from webpack and you
// want to only try running react.
gulp.task("react", function() {
    return gulp.src(["./js/**/*.js"])
        .pipe(react({
            harmony: true,
            // Skip Flow type annotations!
            stripTypes: true
        }))
        .pipe(gulp.dest("./build"));
});

gulp.task('webpack', function(callback) {
    webpack({
        entry: './js/main.js',
        output: {
            filename: 'build/bundle.js',
            publicPath: 'http://localhost:8094/assets'
        },
        module: {
            loaders: [
                {
                    //tell webpack to use jsx-loader for all *.jsx files
                    test: /\.js$/,
                    loader: 'regenerator-loader'
                },
                {
                    //tell webpack to use jsx-loader for all *.jsx files
                    test: /\.js$/,
                    loader: 'jsx-loader?insertPragma=React.DOM&harmony&stripTypes'
                }
            ],
        },
        externals: {
            //don't bundle the 'react' npm package with our bundle.js
            //but get it from a global 'React' variable
            'react': 'React'
        },
        resolve: {
            extensions: ['', '.js', '.jsx']
        }
    }, function(err, stats) {
        if(err) throw new gutil.PluginError("webpack", err);
        gutil.log("[webpack]", stats.toString({
            // output options
        }));
        callback();
    });
});

gulp.task('package', function () {
  return gulp.src('', {read: false})
    .pipe(shell([
      './tools/package'
    ]))
});

// Concatenate & Minify JS
gulp.task("releasify", function() {
    return gulp.src("build/**/*.js")
        .pipe(concat("all.js"))
        .pipe(gulp.dest("dist"))
        .pipe(rename("all.min.js"))
        .pipe(uglify())
        .pipe(gulp.dest("dist"));
});

// Test
gulp.task("test", function() {
     return gulp.src("__tests__").pipe(jest({
        scriptPreprocessor: "./js/preprocessor.js",
        unmockedModulePathPatterns: [
            "node_modules/react"
        ],
        testDirectoryName: "js",
        testPathIgnorePatterns: [
            "node_modules",
            "js/preprocessor.js"
        ],
        moduleFileExtensions: [
            "js",
            "json",
            "react"
        ]
    }));
});

// Watch Files For Changes
gulp.task("watch", function() {
    gulp.watch("js/**/*.js", ["lint", "webpack"]);
    gulp.watch("style/**/*.less", ["less"]);
});

// Default Task
// Not including Flow typechecking by default because it takes so painfully long.
// Maybe because of my code layout or otheriwse, needto figure it out before enabling by default.
gulp.task("default", function(cb) {
    runSequence(["lint", "less", "webpack"], "package", cb);
});
