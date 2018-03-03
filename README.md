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
const hasChangedDepsAsync = require('gulp-haschanged-deps-async');
const gulp = require('gulp');
const changed = require('gulp-changed');

const SRC = 'src/*.js';
const DEST = 'dist';

gulp.task('default', () =>
  gulp.src(SRC)
    .pipe(changed(DEST, {
      hasChanged: hasChangedDepsAsync({
        allowMissingDeps: false
      }
    }))
    // `ngAnnotate` will only get the files that
    // changed since the last time it was run
    .pipe(ngAnnotate())
    .pipe(gulp.dest(DEST))
);
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
