'use strict';

var gulp = require('gulp');
var ghPages = require('gulp-gh-pages');
var replace = require('gulp-replace');
var runSequence = require('run-sequence');

gulp.task('pages', function () {
  return gulp.src('./build/**/*')
    .pipe(ghPages());
});

gulp.task('html5-base', function () {
  return gulp.src('./build/index.html')
    .pipe(replace(
      '<base href="/">',
      '<base href="/asa-competition/">'
    ))
    .pipe(gulp.dest('./build/'));
});

gulp.task('deploy', ['clean'], function (cb) {
  cb = cb || function () {
  };

  global.isProd = true;

  runSequence('prod', 'html5-base', 'pages', cb);
});