var gulp = require('gulp');
var jshint = require('gulp-jshint');
var less = require('gulp-less');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var react = require('gulp-react');

// Lint Task
gulp.task('lint', function() {
    return gulp.src('build/**/*.js')
        .pipe(jshint({
            esnext: true
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
