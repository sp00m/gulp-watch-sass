# gulp-watch-sass

Watches for SASS files modifications thanks to [`gulp-watch`](https://www.npmjs.com/package/gulp-watch), while adding [`@import`](http://sass-lang.com/guide#topic-5)ing SASS files to the stream thanks to [`gulp-fn`](https://www.npmjs.com/package/gulp-fn).

## State

`master`: [![Build](https://api.travis-ci.org/sp00m/gulp-watch-sass.svg?branch=master)](https://travis-ci.org/sp00m/gulp-watch-sass)
[![Coverage](https://coveralls.io/repos/github/sp00m/gulp-watch-sass/badge.svg?branch=master)](https://coveralls.io/github/sp00m/gulp-watch-sass?branch=master)

`develop`: [![Build](https://api.travis-ci.org/sp00m/gulp-watch-sass.svg?branch=develop)](https://travis-ci.org/sp00m/gulp-watch-sass)
[![Coverage](https://coveralls.io/repos/github/sp00m/gulp-watch-sass/badge.svg?branch=develop)](https://coveralls.io/github/sp00m/gulp-watch-sass?branch=develop)

[![Dependencies](https://david-dm.org/sp00m/gulp-watch-sass/status.svg)](https://david-dm.org/sp00m/gulp-watch-sass)
[![Vulnerabilities](https://snyk.io/test/github/sp00m/gulp-watch-sass/badge.svg)](https://snyk.io/test/github/sp00m/gulp-watch-sass)
[![License](https://img.shields.io/badge/license-MIT-brightgreen.svg?style=flat)](https://opensource.org/licenses/MIT)

## Install

```
npm install --save-dev gulp-watch-sass
```

## Usage

```js
const gulp = require("gulp")
const sass = require("gulp-sass")
const watchSass = require("gulp-watch-sass")

gulp.task("sass:watch", () => watchSass([
  "./public/**/*.{scss,css}",
  "!./public/libs/**/*"
])
  .pipe(sass())
  .pipe(gulp.dest("./public")));
```

## API

### watchSass(glob, [options])

Creates a watcher that will spy on files that are matched by `glob` which can be a glob string or array of glob strings. On file change, the modified file and the [`@import`](http://sass-lang.com/guide#topic-5)ing files will be added to the stream.

You can watch for CSS files modifications in addition to SASS ones. In this case, if the modified file is a CSS file, then only the [`@import`](http://sass-lang.com/guide#topic-5)ing files will be added to the stream.

#### options

This object is passed to the [`gulp-watch` options](https://www.npmjs.com/package/gulp-watch#options) directly.

##### options.includePaths

Mimics [node-sass' `includePaths` option](https://github.com/sass/node-sass#includepaths).

## Why?

### `gulp.watch` recompiles all the SASS files:

```js
gulp.task("sass", () => gulp.src([
  "./public/**/*.scss",
  "!./public/libs/**/*"
])
  .pipe(sass())
  .pipe(gulp.dest("./public")));

gulp.task("sass:watch", () => {
  gulp.watch([
    "./public/**/*.scss",
    "!./public/libs/**/*"
  ], ["sass"]);
});
```

This works well, but each time a SASS file is updated, all the project's SASS files are recompiled, which can be quite long when working on big projects.

### [`gulp-watch`](https://www.npmjs.com/package/gulp-watch) doesn't take [`@import`](http://sass-lang.com/guide#topic-5)ing files into account:

```js
gulp.task("sass:watch", () => watch([
  "./public/**/*.scss",
  "!./public/libs/**/*"
])
  .pipe(sass())
  .pipe(gulp.dest("./public")));
```

This recompiles only modified SASS files, but because [`@import`](http://sass-lang.com/guide#topic-5) statements are not resolved, the stylesheets may not be refreshed as expected.
