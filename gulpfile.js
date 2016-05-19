/*eslint-env node */
/* Modified by David Xu, 2016 */
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
var ensureFiles = require('./tasks/ensure-files.js');

var rollup = require('rollup').rollup;
var babel = require('rollup-plugin-babel');
var includePaths = require('rollup-plugin-includepaths');


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

var DIST = 'dist';

var dist = subpath => !subpath ? DIST : path.join(DIST, subpath);

var plumberErrorHandler = function (e) {
  console.log(e);
  this.emit('end');
};

var optimizeStyleTask = (src, buildDest, distDest) => {
  return gulp.src(src)
    .pipe($.plumber(plumberErrorHandler))
    .pipe($.changed(buildDest, {extension: '.css'}))
    .pipe($.autoprefixer(AUTOPREFIXER_BROWSERS))
    .pipe($.minifyCss())
    .pipe($.plumber.stop())
    .pipe(gulp.dest(buildDest))
    .pipe(gulp.dest(distDest))
    .pipe($.size({title: 'css'}));
};

var optimizeImageTask = (src, dest) => {
  return gulp.src(src)
    .pipe($.changed(dest))
    .pipe($.imagemin({
      progressive: true,
      interlaced: true
    }))
    .pipe(gulp.dest(dest))
    .pipe($.size({title: 'images'}));
};

var optimizeHtmlTask = (src, dest) => {
  var assets = $.useref.assets();
  return gulp.src(src)
    .pipe($.changed(dest))
    .pipe(assets)
    // Concatenate and minify JavaScript
    .pipe($.if('*.js', $.uglify({
      preserveComments: 'some'
    })))
    // Concatenate and minify styles
    // In case you are still using useref build blocks
    .pipe($.if('*.css', $.minifyCss()))
    .pipe(assets.restore())
    .pipe($.useref())
    // Minify any HTML
    .pipe($.if('*.html', $.minifyHtml({
      quotes: true,
      empty: true,
      spare: true
    })))
    .pipe(gulp.dest(dest))
    .pipe($.size({
      title: 'html'
    }));
};

// Ensure that we are not missing required files for the project "dot" files are
// specifically tricky due to them being hidden on some systems.
gulp.task('ensureFiles', cb => {
  var requiredFiles = ['.bowerrc'];
  ensureFiles(requiredFiles.map(p => path.join(__dirname, p)), cb);
});

gulp.task('styles', () => {
  return optimizeStyleTask('app/styles/**/*.css', 'build/styles', dist('styles'));
});

gulp.task('images', () => {
  return optimizeImageTask('app/images/**/*', dist('images'));
});

// Copy all files at the root level (app)
gulp.task('copy', () => {
  var app = gulp.src([
    'app/*',
    '!app/test',
    '!app/elements',
    '!app/bower_components',
    '!app/cache-config.json',
    '!**/.DS_Store'
  ], {
    dot: true
  })
        .pipe($.changed(dist()))
        .pipe(gulp.dest(dist()));

  // Copy over only the bower_components we need
  // These are things which cannot be vulcanized
  var bower = gulp.src([
    'app/bower_components/{webcomponentsjs,platinum-sw,sw-toolbox,promise-polyfill,texlivejs}/**/*',
    '!app/bower_components/texlivejs/texlive/texmf-dist/scripts/**'
  ])
        .pipe($.changed(dist()))
        .pipe(gulp.dest(dist('bower_components')));

  return merge(app, bower)
    .pipe($.size({
      title: 'copy'
    }));
});

gulp.task('rollup', () => {
  return rollup({
    entry: 'app/scripts/app.js',
    onwarn: $.util.log,
    plugins: [
      babel({
        exclude: 'node_modules/**'
        // plugins: ['external-helpers-2'],
        // externalHelpers: true
      })
    ]
  }).then(bundle => {
    bundle.write({
      sourceMap: true,
      dest: 'build/scripts/app.js'
    });
    bundle.write({
      dest: dist('scripts/app.js')
    });
  });
});

gulp.task('js', ['rollup'], () => {
  return gulp.src(['app/**/*.html', '!app/bower_components/**'])
    .pipe($.sourcemaps.init())
    .pipe($.if('*.html', $.crisper({scriptInHead: false}))) // Extract JS from .html files
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest('build'))
    .pipe(gulp.dest(dist()));
});

// Copy web fonts to dist
gulp.task('fonts', () => {
  return gulp.src(['app/fonts/**/*'])
    .pipe(gulp.dest(dist('fonts')))
    .pipe($.size({
      title: 'fonts'
    }));
});

// Scan your HTML for assets & optimize them
gulp.task('html', ['styles'], () => {
  return optimizeHtmlTask(
    ['build/**/*.html',
     '!' + dist('{elements,test,bower_components}/**/*.html')],
    dist());
});

// Copy all bower_components over to help js task and vulcanize work together
gulp.task('bower_components', () => {
  return gulp.src('app/bower_components/**/*')
    .pipe($.changed('build/bower_components/'))
    .pipe(gulp.dest('build/bower_components/'));
});

// Vulcanize granular configuration.
gulp.task('vulcanize', ['bower_components'], () => {
  return gulp.src('build/elements/elements.html')
    .pipe($.vulcanize({
      stripComments: true,
      inlineCss: true,
      inlineScripts: true
    }))
    .on('error', e => console.error(e))
    .pipe(gulp.dest(dist('elements')))
    .pipe($.size({title: 'vulcanize'}));
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
  return del(['build', dist()]);
});

// Watch files for changes & reload
gulp.task('serve', ['styles', 'js'], () => {
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
      baseDir: ['build', 'app'],
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

  gulp.watch(['app/**/*.html', '!app/bower_components/**/*.html'], ['js', reload]);
  gulp.watch(['app/styles/**/*.css'], ['styles', reload]);
  gulp.watch(['app/scripts/**/*.js'], ['js', reload]);
  gulp.watch(['app/images/**/*'], reload);
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


gulp.task('dist', cb => {
  // Uncomment 'cache-config' if you are going to use service workers.
  runSequence(
    'bower_components',
    ['ensureFiles', 'copy', 'styles'],
    'js',
    ['images', 'fonts', 'html'],
    'vulcanize',
    // 'cache-config',
    cb);
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
    'app/scripts/**/*.js',
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
