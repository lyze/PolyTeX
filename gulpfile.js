/*eslint-env node */
/* Modifications copyright David Xu, 2016 */
/*
@license
Copyright (c) 2015 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

'use strict';

// Include promise polyfill for node 0.10 compatibility
require('es6-promise').polyfill();

// Include Gulp & tools we'll use
var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var del = require('del');
var runSequence = require('run-sequence');
var browserSync = require('browser-sync');
var reload = browserSync.reload;
var merge = require('merge-stream');
var path = require('path');
var fs = require('fs');
var glob = require('glob-all');
var historyApiFallback = require('connect-history-api-fallback');
var packageJson = require('./package.json');
var crypto = require('crypto');

var rollup = require('rollup').rollup;
var babel = require('rollup-plugin-babel');
var includePaths = require('rollup-plugin-includepaths');

var ensureFiles = require('./tasks/ensure-files.js');


var AUTOPREFIXER_BROWSERS = [
  'ie >= 10',
  'ie_mob >= 10',
  'ff >= 30',
  'chrome >= 34',
  'safari >= 7',
  'opera >= 23',
  'ios >= 7',
  'android >= 4.4',
  'bb >= 10'
];

const DIST = 'dist';
const dist = subpath => !subpath ? DIST : path.join(DIST, subpath);
const toDist = subpath => gulp.dest(dist(subpath));

const BUILD = 'build';
const build = subpath => !subpath ? BUILD : path.join(BUILD, subpath);
const toBuild = subpath => gulp.dest(build(subpath));

const TMP = 'tmp';
const tmp = subpath => !subpath ? TMP : path.join(TMP, subpath);
const toTmp = subpath => gulp.dest(tmp(subpath));

const toMinifyHtml = () => $.htmlmin({
  collapseWhitespace: true,
  conservativeCollapse: true,
  preserveLineBreaks: true
});

const toMinifyJs = () => $.uglify({
  preserveComments: 'some'
});

var plumberErrorHandler = function (e) {
  console.log(e);
  this.emit('end');
};

gulp.task('copy', () => {
  return gulp.src([
    'app/robots.txt',
    'app/favicon.ico',
    'app/manifest.json',        // TODO custom manifest.json
    '!**/.DS_Store'
  ], {
    base: 'app',
    dot: true
  })
    .pipe($.changed(build()))
    .pipe(toBuild())
    .pipe($.size({
      title: 'copy'
    }));
});

gulp.task('dist-copy', () => {
  return gulp.src([
    'app/robots.txt',
    'app/favicon.ico',
    'app/manifest.json',        // TODO custom manifest.json
    '!**/.DS_Store',

    // Cannot vulcanize the following, so copy straight to final destination
    'app/bower_components/{webcomponentsjs,platinum-sw,sw-toolbox,promise-polyfill,texlivejs,es6-promise}/**/*',
    '!app/bower_components/texlivejs/texlive/texmf-dist/scripts/**'
  ], {
    base: 'app',
    dot: true
  })
    .pipe($.changed(dist()))
    .pipe(toDist())
    .pipe($.size({
      title: 'dist-copy'
    }));
});


gulp.task('styles', () => {
  return gulp.src('app/styles/**', {base: 'app'})
    .pipe($.changed(build()))
    .pipe($.sourcemaps.init())
    .pipe($.plumber(plumberErrorHandler))

    .pipe($.if('*.css', $.autoprefixer(AUTOPREFIXER_BROWSERS)))

    .pipe($.plumber.stop())
    .pipe($.sourcemaps.write('.'))
    .pipe(toBuild())
    .pipe($.size({title: 'styles'}));
});

gulp.task('dist-styles', () => {
  return gulp.src('app/styles/**', {base: 'app'})
    .pipe($.changed(dist()))
    .pipe($.sourcemaps.init())
    .pipe($.plumber(plumberErrorHandler))

    .pipe($.if('*.css', $.autoprefixer(AUTOPREFIXER_BROWSERS)))
    .pipe($.if('*.css', $.minifyCss()))
    .pipe($.if('*.html', toMinifyHtml()))

    .pipe($.plumber.stop())
    .pipe($.sourcemaps.write('.'))
    .pipe(toDist())
    .pipe($.size({title: 'dist-styles'}));
});


gulp.task('images', () => {
  return gulp.src('app/images/**', {base: 'app'})
    .pipe($.changed(build()))
    .pipe(toBuild())
    .pipe($.size({title: 'images'}));
});

gulp.task('dist-images', () => {
  return gulp.src('app/images/**', {base: 'app'})
    .pipe($.changed(dist()))
    .pipe($.imagemin({
      progressive: true,
      interlaced: true
    }))
    .pipe(toDist())
    .pipe($.size({title: 'dist-images'}));
});


gulp.task('fonts', () => {
  return gulp.src(['app/fonts/**/*'], {base: 'app'})
    .pipe(toBuild())
    .pipe($.size({
      title: 'fonts'
    }));
});

gulp.task('dist-fonts', () => {
  return gulp.src(['app/fonts/**/*'], {base: 'app'})
    .pipe(toDist())
    .pipe($.size({
      title: 'fonts'
    }));
});


gulp.task('rollup', () => {
  return rollup({
    entry: 'app/scripts/app.js',
    onwarn: $.util.log,
    plugins: [
      babel({
        presets: ['es2015-rollup'],
        exclude: 'node_modules/**'
      })
    ]
  }).then(bundle => {
    bundle.write({
      sourceMap: true,
      dest: path.resolve(build('scripts/app.js'))
    });
  });
});

gulp.task('dist-rollup', () => {
  return rollup({
    entry: 'app/scripts/app.js',
    onwarn: $.util.log,
    plugins: [
      babel({
        presets: ['es2015-rollup'],
        exclude: 'node_modules/**'
      })
    ]
  }).then(bundle => {
    bundle.write({
      sourceMap: true,
      dest: path.resolve(dist('scripts/app.js'))
    });
  });
});

// Transpile ES6 in elements directory.
gulp.task('elements', () => {
  return gulp.src(['app/elements/**/*'], {base: 'app'})
    .pipe($.changed(build()))
    .pipe($.sourcemaps.init())
    .pipe($.plumber(plumberErrorHandler))

    .pipe($.if('*.html', $.crisper({scriptInHead: false})))
    .pipe($.if('*.js', $.babel({presets: ['es2015']})))

    .pipe($.plumber.stop())
    .pipe($.sourcemaps.write('.'))
    .pipe(toBuild())
    .pipe($.size({title: 'elements'}));
});

// Output to a temporary directory for use by vulcanize
gulp.task('tmp-optimize-elements', () => {
  return gulp.src(['app/elements/**/*'], {base: 'app'})
    .pipe($.changed(tmp()))
    .pipe($.sourcemaps.init())
    .pipe($.plumber(plumberErrorHandler))

    .pipe($.if('*.html', $.crisper({scriptInHead: false})))
    .pipe($.if('*.html', toMinifyHtml()))
    .pipe($.if('*.js', $.babel({presets: ['es2015']})))
    .pipe($.if('*.js', toMinifyJs()))

    .pipe($.plumber.stop())
    .pipe($.sourcemaps.write('.'))
    .pipe(toTmp())
    .pipe($.size({title: 'dist-elements'}));
});

// FIXME Since we depend on dist-styles to have run, there will be a duplicate of the css in the dist directory.
gulp.task('dist-elements', ['dist-styles', 'tmp-optimize-elements'], () => {
  return gulp.src(tmp('elements/elements.html'))
    .pipe($.changed(dist('elements')))
    .pipe($.plumber(plumberErrorHandler))

    .pipe($.vulcanize({
      stripComments: true,
      inlineCss: true,
      inlineScripts: true,
      redirects: [
        `${__dirname}/tmp/bower_components|${__dirname}/app/bower_components`,
        `${__dirname}/tmp/styles|${__dirname}/dist/styles`,
      ]
    }))
    .pipe($.if('*.html', toMinifyHtml()))

    .pipe($.plumber.stop())
    .pipe(gulp.dest(dist('elements')))
    .pipe($.size({title: 'vulcanize'}));
});

gulp.task('html', () => {
  return gulp.src('app/*.html')
    .pipe($.changed(build()))
    .pipe(toBuild())
    .pipe($.size({title: 'html'}));
});

gulp.task('dist-html', [
  'dist-copy', 'dist-styles', 'dist-images', 'dist-fonts', 'dist-rollup', 'dist-elements'
], () => {
  return gulp.src('app/*.html')
    .pipe($.changed(dist()))
     // FIXME the unconcatenated files still exist in the dist directory
    .pipe($.useref({searchPath: [dist()]}))
    .pipe(toDist())
    .pipe($.size({title: 'dist-html'}));
});


gulp.task('devel-unoptimized', [
  'copy', 'html', 'styles', 'images', 'fonts', 'rollup', 'elements'
]);

gulp.task('dist', ['dist-copy', 'dist-html']);

// Ensure that we are not missing required files for the project "dot" files are
// specifically tricky due to them being hidden on some systems.
gulp.task('ensureFiles', cb => {
  var requiredFiles = ['.bowerrc'];
  ensureFiles(requiredFiles.map(p => path.join(__dirname, p)), cb);
});

// Generate config data for the <sw-precache-cache> element.
// This include a list of files that should be precached, as well as a (hopefully unique) cache
// id that ensure that multiple PSK projects don't share the same Cache Storage.
// This task does not run by default, but if you are interested in using service worker caching
// in your project, please enable it within the 'default' task.
// See https://github.com/PolymerElements/polymer-starter-kit#enable-service-worker-support
// for more context.
gulp.task('cache-config', callback => {
  var dir = dist();
  var config = {
    cacheId: packageJson.name || path.basename(__dirname),
    disabled: false
  };

  glob(
    ['index.html',
     './',
     'bower_components/webcomponentsjs/webcomponents-lite.min.js',
     '{elements,scripts,styles}/**/*.*'],
    {cwd: dir},
    (error, files) => {
      if (error) {
        callback(error);
      } else {
        config.precache = files;

        var md5 = crypto.createHash('md5');
        md5.update(JSON.stringify(config.precache));
        config.precacheFingerprint = md5.digest('hex');

        var configPath = path.join(dir, 'cache-config.json');
        fs.writeFile(configPath, JSON.stringify(config), callback);
      }
    });
});

// Clean output directory
gulp.task('clean', () => {
  return del([build(), tmp(), dist()]);
});

// Watch files for changes & reload
gulp.task('serve', ['devel-unoptimized'], () => {
  browserSync({
    port: 5000,
    notify: false,
    logPrefix: 'PolyTeX',
    snippetOptions: {
      rule: {
        match: '<span id="browser-sync-binding"></span>',
        fn: function (snippet) {
          return snippet;
        }
      }
    },
    // Run as an https by uncommenting 'https: true'
    // Note: this uses an unsigned certificate which on first access
    //       will present a certificate warning in the browser.
    // https: true,
    server: {
      baseDir: ['build'],
      routes: {
        '/bower_components': 'app/bower_components'
      },
      middleware: [
        historyApiFallback({
          // workaround for pdftex-worker.js for requests like texmf-dist/ls-R
          rewrites: [{
              from: /^\/bower_components\/.*$/,
              to: context => context.parsedUrl.pathname
          }]
        })
      ]
    }
  });

  gulp.watch(['app/**', '!app/bower_components/**'], ['devel-unoptimized', reload]);
});

// Build and serve the output from the dist build
gulp.task('serve-dist', ['dist'], () => {
  browserSync({
    port: 5001,
    notify: false,
    logPrefix: 'PolyTeX',
    snippetOptions: {
      rule: {
        match: '<span id="browser-sync-binding"></span>',
        fn: function (snippet) {
          return snippet;
        }
      }
    },
    // Run as an https by uncommenting 'https: true'
    // Note: this uses an unsigned certificate which on first access
    //       will present a certificate warning in the browser.
    // https: true,
    server: {
      baseDir: [dist()],
      middleware: [
        historyApiFallback({
          // workaround for pdftex-worker.js for requests like texmf-dist/ls-R
          rewrites: [{
            from: /^\/bower_components\/.*$/,
            to: context => context.parsedUrl.pathname
          }]
        })
      ]
    }
  });

  gulp.watch(['app/**/*', '!app/bower_components/**/*'], ['dist', reload]);
});

// Build production files, the default task
gulp.task('default', cb => runSequence('clean', 'dist', cb));

// Build then deploy to GitHub pages gh-pages branch
gulp.task('build-deploy-gh-pages', cb => {
  runSequence(
    'default',
    'deploy-gh-pages',
    cb);
});

// Deploy to GitHub pages gh-pages branch
gulp.task('deploy-gh-pages', () => {
  return gulp.src(dist('**/*'))
    // Check if running task from Travis CI, if so run using GH_TOKEN
    // otherwise run using ghPages defaults.
    .pipe($.if(process.env.TRAVIS === 'true', $.ghPages({
      remoteUrl: 'https://$GH_TOKEN@github.com/lyze/PolyTeX.git',
      silent: true,
      branch: 'gh-pages'
    }), $.ghPages()));
});

gulp.task('lint', () => {
  return gulp.src([
    'app/**/*.js',
    '!app/bower_components/**',
    'app/**/*.html',
    'gulpfile.js'])
    .pipe(reload({
      stream: true,
      once: true
    }))
    .pipe($.eslint())
    .pipe($.eslint.format())
    .pipe($.eslint.failAfterError());
});

// Load tasks for web-component-tester
// Adds tasks for `gulp test:local` and `gulp test:remote`
require('web-component-tester').gulp.init(gulp);

// Load custom tasks from the `tasks` directory
try {
  require('require-dir')('tasks');
} catch (err) {
  // Do nothing
}
