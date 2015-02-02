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
    transform = require("vinyl-transform"),
    exorcist = require("exorcist"),
    fs = require("fs"),
    es = require("event-stream"),
    JSONStream = require("JSONStream"),
    runSequence = require("run-sequence"),
    _ = require("underscore");

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

gulp.task("copy-init", function() {
    return gulp.src("./js/init.js")
        .pipe(gulp.dest("./build"));
});

var packages = {};
var allFiles = [];
gulp.task("read-packages", function() {
    return fs.createReadStream("javascript-packages.json")
        .pipe(JSONStream.parse())
        .pipe(es.mapSync(function (p) {
            packages = p;

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

                otherFiles.forEach(function(f) {
                    var data = f.split(":")
                    if (data.length === 1) {
                        b.external(data[0]);
                    } else if (data.length > 1) {
                        b.external(data[0]);
                    } else {
                        console.error("no file specified for gulp package")
                    }
                });


                packages[p].forEach(function(f) {
                    var data = f.split(":")
                    if (data.length === 1) {
                        b.require(data[0]);
                    } else if (data.length > 1) {
                        b.require(data[1], {
                            expose: data[0]
                        });
                    } else {
                        console.error("no file specified for gulp package")
                    }
                });

                (function(p, b) {
                    // Create a new gulp task with the name of the package
                    gulp.task(p, function() {
                        // Convert to react and strip out Flow types
                        return b.transform({
                            "strip-types": true,
                            es6: true}, reactify)
                        .bundle()
                        // Extract the source map fro the source bundle
                        .pipe(exorcist(mapfile))
                        .pipe(fs.createWriteStream(path.join(__dirname, "./build/" + p), "utf8"));
                    });
                })(p, b);
            }


        }));
});

gulp.task("build-packages", function(cb) {
    // Note the packages are not run sequentially, they are run together
    // and then the callback cb is run sequentially after they are all
    // complete.
    runSequence(_.keys(packages), cb);
});

gulp.task("browserify", function(cb) {
    runSequence(["copy-init", "read-packages"], "build-packages", cb);
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
    gulp.watch("js/**/*.js", ["lint", "typecheck", "browserify"]);
    gulp.watch("style/**/*.less", ["less"]);
});

// Default Task
// Not including Flow typechecking by default because it takes so painfully long.
// Maybe because of my code layout or otheriwse, needto figure it out before enabling by default.
gulp.task("default", ["lint", "typecheck", "less", "browserify", "watch"]);
