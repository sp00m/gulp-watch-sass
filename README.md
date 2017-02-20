# gulp-watch-sass

Watches for SASS files modifications thanks to [`gulp-watch`](https://www.npmjs.com/package/gulp-watch), while adding [`@import`](http://sass-lang.com/guide#topic-5)ing SASS files to the stream thanks to [`gulp-fn`](https://www.npmjs.com/package/gulp-fn).

### State

`master`: [![Build](https://api.travis-ci.org/sp00m/gulp-watch-sass.svg?branch=master)](https://travis-ci.org/sp00m/gulp-watch-sass)
[![Coverage](https://coveralls.io/repos/github/sp00m/gulp-watch-sass/badge.svg?branch=master)](https://coveralls.io/github/sp00m/gulp-watch-sass?branch=master)

`develop`: [![Build](https://api.travis-ci.org/sp00m/gulp-watch-sass.svg?branch=develop)](https://travis-ci.org/sp00m/gulp-watch-sass)
[![Coverage](https://coveralls.io/repos/github/sp00m/gulp-watch-sass/badge.svg?branch=develop)](https://coveralls.io/github/sp00m/gulp-watch-sass?branch=develop)

[![Dependencies](https://david-dm.org/sp00m/gulp-watch-sass/status.svg)](https://david-dm.org/sp00m/gulp-watch-sass)
[![Vulnerabilities](https://snyk.io/test/github/sp00m/gulp-watch-sass/badge.svg)](https://snyk.io/test/github/sp00m/gulp-watch-sass)
[![License](https://img.shields.io/badge/license-MIT-brightgreen.svg?style=flat)](https://opensource.org/licenses/MIT)

### Install

```
npm intall --save-dev gulp-watch-sass
```

### Usage

```js
const gulp = require("gulp")
const sass = require("gulp-sass")
const watchSass = require("gulp-watch-sass")

gulp.task("sass:watch", () => watchSass([
    "../public/**/*.{sass,scss}",
    "!../public/libs/**/*"
  ])
    .pipe(sass().on("error", sass.logError))
    .pipe(gulp.dest("../public")))
```

### Why?

1. **`gulp.watch` recompiles all the SASS files**

```js
gulp.task("sass", () => gulp.src([
    "../public/**/*.{sass,scss}",
    "!../public/libs/**/*"
  ])
    .pipe(sass().on("error", sass.logError))
    .pipe(gulp.dest("./public")))

gulp.task("sass:watch", () => {
  gulp.watch("./sass/**/*.scss", ["sass"])
})
```

This works well, but each time a SASS file is updated, all the project's SASS files are recompiled, which can be quite long when working on big projects.

2. **[`gulp-watch`](https://www.npmjs.com/package/gulp-watch) doesn't take [`@import`](http://sass-lang.com/guide#topic-5)ing files into account**

```js
gulp.task("sass:watch", () => watch([
    "../public/**/*.{sass,scss}",
    "!../public/libs/**/*"
  ])
    .pipe(sass().on("error", sass.logError))
    .pipe(gulp.dest("../public")))
```

This recompiles only modified SASS files, but because [`@import`](http://sass-lang.com/guide#topic-5) statements are not resolved, the stylesheets may not be refreshed as expected.
