var gulp = require('gulp');
var runSequence = require('run-sequence');
var watch = require('gulp-watch');
var jshint = require('gulp-jshint');
var uglify = require('gulp-uglify');
var minify = require('gulp-minify-css');
var csslint = require('gulp-csslint');
var print = require('gulp-print');
var concat = require('gulp-concat');

// Environment and options
var pkg = require('./package.json');
var options = {
  watchFiles: [
    'public/**',
    'views/**'
  ],
  jsFiles: 'public/js/script.js',
  cssFiles: 'public/css/style.css',
  cssLintOptions: {
    'important': false,
    'vendor-prefix': false,
    'compatible-vendor-prefixes': false,
    'box-sizing': false,
    'fallback-colors': false,
    'box-model': false,
    'adjoining-classes': false,
    'outline-none': false,
    'font-sizes': false,
    'bulletproof-font-face': false
  },
  banner: [
    '/**',
    ' * <%= pkg.name %> - <%= pkg.description %>',
    ' * v<%= pkg.version %>',
    ' * <%= pkg.homepage %>',
    ' * ',
    ' * <%= pkg.author %> <%= new Date().getFullYear() %>',
    ' */',
    '',
    ''
  ].join('\n')
};

// Lint JavaScript
gulp.task('lint-js', function() {
  return gulp.src(options.jsFiles)
  .pipe(jshint())
  .pipe(print(function(filepath) {
    return " - " + filepath;
  }))
  .pipe(jshint.reporter('default'));
});

// Lint CSS
gulp.task('lint-css', function() {
    return gulp.src(options.cssFiles)
        .pipe(csslint(options.cssLintOptions))
        .pipe(print(function(filepath) {
            return " - " + filepath;
        }))
        .pipe(csslint.reporter());
});

// Build
gulp.task('build', function(callback) {
  runSequence('lint-js', 'lint-css', callback);
});

// Watch for changes
gulp.task('watch', function() {
  return gulp.watch(options.watchFiles, ['build']);
});

// Default (development)
gulp.task('default', function(callback) {
  runSequence('build', 'watch', callback);
});
