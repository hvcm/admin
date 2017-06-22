"use strict";

const gulp = require('gulp');
const watch = require('gulp-watch');
const nodemon = require('gulp-nodemon');
const browserSync = require('browser-sync');
const reload = browserSync.reload;

let demon;

function normalizePort(val) {
  const port = parseInt(val, 10);

  if (isNaN(port)) {
    return val;
  }

  if (port >= 0) {
    return port;
  }

  return false;
}
gulp.task('default', ['dev-server']);

gulp.task('dev-server', () => {
  demon = nodemon({
    script: 'bin/www',
    env: {
      NODE_ENV: 'development'
    }
  });

  gulp.watch([
    'routes/**/*.*', 'app.js', 'bin/www'
  ], demon.restart);

  const port = normalizePort(process.env.PORT || '3000');

  browserSync({
    port: 5000,
    proxy: `localhost:${port}`,
    startPath: '/',
    notify: false,
    logPrefix: 'PSK',
    startPath: '/',
    files: ["public/**/*.html"],
    snippetOptions: {
      rule: {
        match: '<span id="browser-sync-binding"></span>',
        fn: function(snippet) {
          return snippet;
        }
      }
    },
    // Run as an https by uncommenting 'https: true'
    // https: true,
    reloadDelay: 100
  });
});
