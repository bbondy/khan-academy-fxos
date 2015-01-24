var gulp = require('gulp');
var jshint = require('gulp-jshint');
var less = require('gulp-less');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var path = require('path');
var rename = require('gulp-rename');
var react = require('gulp-react');
var flowtype = require('gulp-flowtype');
var source = require('vinyl-source-stream');
var jsxcs = require('gulp-jsxcs');
var gutil = require('gulp-util');
var jest = require('gulp-jest');
var browserify = require('browserify');
var reactify = require('reactify');
var es6defaultParams = require('es6-default-params');

// Lint Task
gulp.task('prelint', function() {
    return gulp.src('js/**/*.js')
        .pipe(jsxcs().on('error', function(err) {
            console.log(err.toString());
        }))
        .pipe(jshint.reporter('default'));
});

// Lint Task
gulp.task('postlint', function() {
    return gulp.src('build/**/*.js')
        .pipe(jshint({
            esnext: true
        }))
        .pipe(jshint.reporter('default'));
});



gulp.task('typecheck', function() {
    return gulp.src('js/**/*.js')
        .pipe(flowtype({
            declarations: './flowtypes',
            background: false,    // Watch/Server mode
            all: false,           // Check all files regardless
            lib: '',              // Library directory
            module: '',           // Module mode
            stripRoot: false,     // Relative vs Absolute paths
            weak: false,          // Force weak check
            showAllErrors: false, // Show more than 50 errors
            killFlow: false,
        }))
        .pipe(jshint.reporter('default'));
});

// Compile Our LESS
gulp.task('less', function() {
    return gulp.src('./style/**/*.less')
        .pipe(less({
            paths: [ path.join(__dirname, 'style') ]
        }))
        .pipe(gulp.dest('./build/css'));
});

gulp.task('react', function() {
    return browserify('./js/main.js')
        .transform({
            'strip-types': true,
            es6: true}, reactify)
        .transform(es6defaultParams)
        .bundle()
        .pipe(source('bundle.js'))
        .pipe(gulp.dest('./build'));
        /*
        .pipe(react({
            harmony: true,
            // Skip Flow type annotations!
            stripTypes: true
        }))
        */

});

// Concatenate & Minify JS
gulp.task('releasify', function() {
    return gulp.src('build/**/*.js')
        .pipe(concat('all.js'))
        .pipe(gulp.dest('dist'))
        .pipe(rename('all.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('dist'));
});

// Test
gulp.task('test', function() {
    return gulp.src('__tests__').pipe(jest({
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
gulp.task('watch', function() {
    gulp.watch('js/**/*.js', ['prelint', 'typecheck', 'react']);
    gulp.watch('build/**/*.js', ['postlint']);
    gulp.watch('style/**/*.less', ['less']);
});

// Default Task
// Not including Flow typechecking by default because it takes so painfully long.
// Maybe because of my code layout or otheriwse, needto figure it out before enabling by default.
gulp.task('default', ['prelint', 'typecheck', 'react', 'less', 'postlint', 'watch']);
