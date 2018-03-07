# gulp-haschanged-deps-async

[![build status](https://img.shields.io/travis/niftylettuce/gulp-haschanged-deps-async.svg)](https://travis-ci.org/niftylettuce/gulp-haschanged-deps-async)
[![code coverage](https://img.shields.io/codecov/c/github/niftylettuce/gulp-haschanged-deps-async.svg)](https://codecov.io/gh/niftylettuce/gulp-haschanged-deps-async)
[![code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/sindresorhus/xo)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![made with lass](https://img.shields.io/badge/made_with-lass-95CC28.svg)](https://lass.js.org)
[![license](https://img.shields.io/github/license/niftylettuce/gulp-haschanged-deps-async.svg)](LICENSE)

> Provides a hasChanged function for use with gulp-changed to check mtimes of a file's dependencies.

This package is a modern and updated fork of [gulp-haschanged-deps](https://github.com/mattpowell/gulp-haschanged-deps) and as such I've retained the original author's licensing as it was inspired by his work.


## Table of Contents

* [Install](#install)
* [Usage](#usage)
* [Contributors](#contributors)
* [License](#license)


## Install

[npm][]:

```sh
npm install gulp-haschanged-deps-async
```

[yarn][]:

```sh
yarn add gulp-haschanged-deps-async
```


## Usage

```js
const gulp = require('gulp');
const filter = require('gulp-custom-filter');
const hasChangedDepsAsync = require('gulp-haschanged-deps-async');
const less = require('gulp-less');

gulp.task('less', () => {
  return (
    gulp
      .src(['less/**/*.less'])
      .pipe(
        filter(
          hasChangedDepsAsync('css', {
            // the cwd option is for resolving paths to packages
            // and it defaults to the directory process is running from
            cwd: process.cwd(),
            // an optional extension you can pass if the file extension changes
            extension: '.css',
            // this is optional option, but useful for specifying directly
            // so that no auto-detection is required by `precinct`
            // <https://github.com/dependents/node-precinct>
            precinct: {
              type: 'less'
            }
          })
        )
      )
      .pipe(sourcemaps.init())
      .pipe(less())
      .pipe(sourcemaps.write('.'))
      .pipe(gulp.dest('css'))
  );
});
```


## Contributors

| Name           | Website                    |
| -------------- | -------------------------- |
| **Nick Baugh** | <http://niftylettuce.com/> |


## License

[MIT](LICENSE) © Matt Powell


## 

[npm]: https://www.npmjs.com/

[yarn]: https://yarnpkg.com/
