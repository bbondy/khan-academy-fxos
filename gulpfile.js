var gulp = require('gulp'),
    jshint = require('gulp-jshint'),
    less = require('gulp-less'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify'),
    rename = require('gulp-rename'),
    react = require('gulp-react'),
    jsxcs = require("gulp-jsxcs");


// Lint Task
gulp.task('lint', function() {
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
            harmony: true
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
    gulp.watch('js/**/*.js', ['react']);
    gulp.watch('build/**/*.js', ['lint']);
    gulp.watch('style/**/*.less', ['less']);
});

// Default Task
gulp.task('default', ['react', 'less', 'lint', 'watch']);
