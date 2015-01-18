var gulp = require('gulp');
var jshint = require('gulp-jshint');
var less = require('gulp-less');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var react = require('gulp-react');
var flowtype = require('gulp-flowtype');

// Lint Task
gulp.task('lint', function() {
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
            paths: ['./style']
        }))
        .pipe(gulp.dest('./build/css'));
});

gulp.task('react', function() {
    return gulp.src('./js/**/*.js')
        .pipe(react({
            harmony: true,
            // Skip Flow type annotations!
            stripTypes: true
        }))
        .pipe(gulp.dest('./build'));

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

// Watch Files For Changes
gulp.task('watch', function() {
    gulp.watch('js/**/*.js', ['typecheck', 'react']);
    gulp.watch('build/**/*.js', ['lint']);
    gulp.watch('style/**/*.less', ['less']);
});

// Default Task
// Not including Flow typechecking by default because it takes so painfully long.
// Maybe because of my code layout or otheriwse, needto figure it out before enabling by default.
gulp.task('default', ['typecheck', 'react', 'less', 'lint', 'watch']);
