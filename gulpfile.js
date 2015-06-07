var gulp = require("gulp"),
    gutil = require("gulp-util"),
    sourcemaps = require('gulp-sourcemaps'),
    eslint = require('gulp-eslint');
    less = require("gulp-less"),
    path = require("path"),
    shell = require("gulp-shell"),
    react = require("gulp-react"),
    jest = require("gulp-jest"),
    del = require("del"),
    runSequence = require("run-sequence"),
    webpack = require("webpack"),
    webpackConfig = require("./webpack.config.js"),
    WebpackDevServer = require("webpack-dev-server");

var host = process.env.HOST || 'localhost';
var port = process.env.PORT || 8008;

// Lint Task w/ eslint
gulp.task("lint", function() {
    return gulp.src(['./src/**/*.js'])
    .pipe(eslint())
    .pipe(eslint.format());
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
        callback();
    });
});

// Starts a webpack dev-server
// <host>:<port>can be used instead for development.
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
    }).listen(port, host, function(err) {
        if (err) {
            throw new gutil.PluginError("webpack-dev-server", err);
        }
        // Server listening
        gutil.log("[webpack-dev-server]", "http://" + host + ":" + port + "/webpack-dev-server/index.html");
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
        unmockedModulePathPatterns: [
            "node_modules/react"
        ],
        testDirectoryName: "js",
        testPathIgnorePatterns: [
            "node_modules"
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

gulp.task("clean", function(cb) {
    del(["build", "dist", "node_modules"], cb);
});

gulp.task("clobber", function(cb) {
    del(["build", "dist"], cb);
});
