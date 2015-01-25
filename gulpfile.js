var gulp = require("gulp"),
    jshint = require("gulp-jshint"),
    less = require("gulp-less"),
    concat = require("gulp-concat"),
    uglify = require("gulp-uglify"),
    path = require("path"),
    rename = require("gulp-rename"),
    react = require("gulp-react"),
    flowtype = require("gulp-flowtype"),
    jsxcs = require("gulp-jsxcs"),
    jest = require("gulp-jest"),
    browserify = require("browserify"),
    reactify = require("reactify"),
    es6defaultParams = require("es6-default-params"),
    transform = require("vinyl-transform"),
    exorcist = require("exorcist"),
    fs = require("fs"),
    es = require("event-stream"),
    JSONStream = require("JSONStream"),
    _ = require("underscore");

// Lint Task
gulp.task("prelint", function() {
    return gulp.src("js/**/*.js")
        .pipe(jsxcs().on("error", function(err) {
            console.log(err.toString());
        }))
        .pipe(jshint.reporter("default"));
});

// Lint Task
gulp.task("postlint", function() {
    return gulp.src("build/**/*.js")
        .pipe(jshint({
            esnext: true
        }))
        .pipe(jshint.reporter("default"));
});

gulp.task("typecheck", function() {
    return gulp.src("js/**/*.js")
        .pipe(flowtype({
            declarations: "./flowtypes",
            background: false,    // Watch/Server mode
            all: false,           // Check all files regardless
            lib: "",              // Library directory
            module: "",           // Module mode
            stripRoot: false,     // Relative vs Absolute paths
            weak: false,          // Force weak check
            showAllErrors: false, // Show more than 50 errors
            killFlow: false,
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
// This is only present if the errors from
// browserify/reactify are not good enough.
gulp.task("react", function() {
    return gulp.src("./js/**/*.js")
        .pipe(react({
            harmony: true,
            // Skip Flow type annotations!
            stripTypes: true
        }))
        .pipe(gulp.dest("./build"));
});

gulp.task("browserify", function() {

    return fs.createReadStream("javascript-packages.json")
        .pipe(JSONStream.parse())
        .pipe(es.mapSync(function (packages) {
            // Collect all files
            var allFiles = [];
            for (p in packages) {
                allFiles = allFiles.concat(packages[p]);
            }

            // For each package, do the gulp chain externing
            // everything else.  I tried both refactor-bundle and
            // partition-bundle but they didn't seem to have the flexibility
            // I needed.
            var mapfile = path.join(__dirname, "./build/" + p + ".map");
            for (p in packages) {
                otherFiles = _(allFiles).filter(function(f) {
                    return packages[p].indexOf(f) === -1;
                });

                var b = browserify({
                    debug: true
                });
                b.external(otherFiles);
                b.require(packages[p]);

                // Convert to react and strip out Flow types
                b.transform({
                    "strip-types": true,
                    es6: true}, reactify)
                // Convert out ES6 default params
                .transform(es6defaultParams)
                .bundle()
                // Exttract the source map fro the source bundle
                .pipe(exorcist(mapfile))
                .pipe(fs.createWriteStream(path.join(__dirname, './build/' + p), 'utf8'));
            }
         }));
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
        //testDirectoryName: "__test__",
        testPathIgnorePatterns: [
            "perseus",
            "bower_compoennts",
            "node_modules",
            "spec/support"
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
    gulp.watch("js/**/*.js", ["prelint", "typecheck", "browserify"]);
    gulp.watch("build/**/*.js", ["postlint"]);
    gulp.watch("style/**/*.less", ["less"]);
});

// Default Task
// Not including Flow typechecking by default because it takes so painfully long.
// Maybe because of my code layout or otheriwse, needto figure it out before enabling by default.
gulp.task("default", ["prelint", "typecheck", "less", "browserify", "postlint", "watch"]);
