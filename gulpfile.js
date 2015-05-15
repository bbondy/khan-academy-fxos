var gulp = require("gulp"),
    gutil = require("gulp-util"),
    sourcemaps = require('gulp-sourcemaps'),
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
    webpack = require("webpack"),
    webpackConfig = require("./webpack.config.js"),
    WebpackDevServer = require("webpack-dev-server");

// Lint Task
// Uses jsxcs, then strips Flow types and uses jshint.
// Has no output.
gulp.task("lint", function() {
    return gulp.src("src/**/*.js");
    // TODO: Move to eslint
    /*
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
    */
});

/**
 * Compile LESS into CSS puts output in ./build/css
 */
gulp.task("less", function () {
  return gulp.src("./style/**/*.less")
    .pipe(sourcemaps.init())
    .pipe(less({
            paths: [ path.join(__dirname, "style") ]
        }).on('error', function(e) {
          console.log('error running less', e);
          this.emit('end');
        }))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest("./build/css"));
});

// The react task should not normally be needed.
// This is only present if the errors from webpack and you
// want to only try running react.
// Puts output in the ./build folder
gulp.task("react", function() {
    return gulp.src(["./src/**/*.js"])
        .pipe(react({
            harmony: true,
            // Skip Flow type annotations!
            stripTypes: true
        }))
        .pipe(gulp.dest("./build"));
});

// Copy minify.js to the build folder and strip out Flow typechecks
gulp.task("copyMinifyScript", function() {
    return gulp.src(["./src/minify.js"])
        .pipe(react({
            harmony: true,
            // Skip Flow type annotations!
            stripTypes: true
        }))
        .pipe(gulp.dest("./build"));
});
// Runs ./tools/updateTopicTreeData
gulp.task("runTopicTreeScript", function() {
    return gulp.src("", {read: false})
            .pipe(shell([
        "./tools/updateTopicTreeData"
    ]));
});
// sequences the above 2 tasks to generate new topic tree files
gulp.task("updateTopicTree", function(cb) {
    runSequence("copyMinifyScript", "runTopicTreeScript", cb);
});

// Initiates a webpack operation and puts the bundle in ./build based
// on the config in webpack.config.js.
gulp.task("webpack", function(callback) {
    var myConfig = Object.create(webpackConfig);
    myConfig.debug = true;

    webpack(myConfig, function(err, stats) {
        if(err) {
            throw new gutil.PluginError("webpack", err);
        }
        // Log filenames packed:
        //gutil.log("[webpack]", stats.toString({
            // output options
        //}));
        callback();
    });
});

// Starts a webpack dev-server on port 8008
// localhost:8008 can be used instead for development.
// The bundle.js file will not be written out and will be served from memory.
gulp.task("server", function(callback) {
    var myConfig = Object.create(webpackConfig);
    myConfig.debug = true;
    myConfig.cache = true;
    new WebpackDevServer(webpack(myConfig), {
        publicPath: myConfig.output.publicPath,
        stats: {
            colors: true
        }
    }).listen(8008, "localhost", function(err) {
        if (err) {
            throw new gutil.PluginError("webpack-dev-server", err);
        }
        // Server listening
        gutil.log("[webpack-dev-server]", "http://localhost:8008/webpack-dev-server/index.html");
        // keep the server alive or continue?
        // callback();
    });
});

// Runs the ./tools/package script which bundles the app for Firefox OS devices.
// Puts the output in ./dist/package
gulp.task("package", function () {
  return gulp.src("", {read: false})
    .pipe(shell([
      "./tools/package"
    ]));
});

// Runs Jest tests
gulp.task("test", function() {
     return gulp.src("__tests__").pipe(jest({
        scriptPreprocessor: "./src/preprocessor.js",
        unmockedModulePathPatterns: [
            "node_modules/react"
        ],
        testDirectoryName: "js",
        testPathIgnorePatterns: [
            "node_modules",
            "src/preprocessor.js"
        ],
        moduleFileExtensions: [
            "js",
            "json",
            "react"
        ]
    }));
});

// Watch Files For Changes, when there are some will run lint and webpack
// Will also watch for .less changes and generate new .css.
gulp.task("watch", function() {
    gulp.watch("src/**/*.js", ["lint", "webpack"]);
    gulp.watch("style/**/*.less", ["less"]);
});

// Default Task
// Not including Flow typechecking by default because it takes so painfully long.
// Maybe because of my code layout or otheriwse, needto figure it out before enabling by default.
gulp.task("default", function(cb) {
    runSequence(["lint", "less", "webpack"], "package", cb);
});
