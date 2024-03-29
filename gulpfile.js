var gulp = require('gulp');
var runSequence = require('gulp4-run-sequence');
var print = require('gulp-print');
var jshint = require('gulp-jshint');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var postcss = require('gulp-postcss');
var clean = require('gulp-clean-css');
var header = require('gulp-header');
var babel = require("gulp-babel");

// Environment and options
var pkg = require('./package.json');
var options = {
  lint: {
    css: {
      options: {
        'important': false,
        'vendor-prefix': false,
        'compatible-vendor-prefixes': false,
        'box-sizing': false,
        'fallback-colors': false,
        'adjoining-classes': false,
        'outline-none': false,
        'unqualified-attributes': false
      }
    },
    js: {
      options: {
        esversion: 6
      },
      files:'public/js/script.js'
    }
  },
  dir: {
    js: 'public/js',
    css: 'public/css'
  },
  output: {
    js: 'script.min.js',
    css: 'style.min.css'
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
  return gulp.src(options.lint.js.files)
  .pipe(jshint(options.lint.js.options))
  .pipe(print(function(filepath) {
    return " - " + filepath;
  }))
  .pipe(jshint.reporter('default'));
});

// Minify, concatenate and future-proof JS
gulp.task('scripts', function() {
    return gulp.src([
        options.dir.js + '/**/*.js',
        '!' + options.dir.js + '/**/*.min.js'
      ])
      .pipe(print(function(filepath) {
          return " - " + filepath;
      }))
      .pipe(concat(options.output.js))
      .pipe(babel())
      .pipe(uglify({
          preserveComments: 'license'
      }))
      .pipe(gulp.dest(options.dir.js))
      .pipe(print(function(filepath) {
          return "   > " + filepath;
      }));
});

// Prepend header
gulp.task('header', function() {
    return gulp.src(options.dir.js + '/' + options.output.js)
      .pipe(header(options.banner, { pkg: pkg }))
      .pipe(gulp.dest(options.dir.js));
});

// Minify, concatenate and future-proof CSS
gulp.task('styles', function() {
    return gulp.src([
        options.dir.css + '/**/*.css',
        '!' + options.dir.css + '/**/*.min.css'
      ])
      .pipe(print(function(filepath) {
          return " - " + filepath;
      }))
      .pipe(concat(options.output.css))
      .pipe(postcss([
        require("postcss-cssnext")()
      ]))
      .pipe(clean())
      .pipe(gulp.dest(options.dir.css))
      .pipe(print(function(filepath) {
          return "   > " + filepath;
      }));
});

// Build
gulp.task('build', function(callback) {
  runSequence('lint-js', 'scripts', 'header','styles', callback);
});

// Default (development)
gulp.task('default', function(callback) {
  runSequence('build', 'watch', callback);
});
