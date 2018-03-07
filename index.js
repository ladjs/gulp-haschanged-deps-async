const path = require('path');
const fs = require('fs-extra');
const replaceExt = require('replace-ext');
const nodeResolve = require('resolve');
const precinct = require('precinct');
const PluginError = require('plugin-error');

module.exports = function(destPath, opts = {}) {
  opts = Object.assign(
    {
      cwd: process.cwd(),
      precinct: {},
      extension: ''
    },
    opts
  );

  if (!destPath)
    throw new PluginError(
      'gulp-haschanged-deps-async',
      'Destination path `dest` required'
    );

  return file => {
    return new Promise(async (resolve, reject) => {
      try {
        // TODO: this doesn't throw the error
        // the reject gets suppressed in gulp-filter
        // throw new PluginError('gulp-haschanged-deps-async', 'ugh');
        const deps = await recurse(file.path, opts);
        const sourceMTime = await getLatestMTimeFromDeps(deps);
        let fileDestPath = path.resolve(opts.cwd, destPath, file.relative);
        if (opts.extension)
          fileDestPath = replaceExt(fileDestPath, opts.extension);
        try {
          const targetStat = await fs.stat(fileDestPath);
          resolve(sourceMTime >= targetStat.mtime);
        } catch (err) {
          if (err.code === 'ENOENT') return resolve(true);
          throw err;
        }
      } catch (err) {
        // TODO: we're temporarily outputting this
        console.log('gulp-haschanged-deps-async error', err);
        reject(err);
      }
    });
  };
};

function toDeps(contents, path, precinctOpts) {
  return precinct(contents, precinctOpts);
}

function toResolvedPath(basePath, _path, opts) {
  return new Promise((resolve, reject) => {
    const config = { basedir: opts.cwd };
    let id;
    // if it's a sass, less, or stylus file then don't use require's
    if (
      opts.precinct.type &&
      ['sass', 'less', 'stylus'].includes(opts.precinct.type)
    ) {
      if (opts.precinct.type === 'sass') config.extensions = ['.scss', '.sass'];
      else if (opts.precinct.type === 'stylus') config.extensions = ['.styl'];
      else config.extensions = ['.less'];
      id = path.resolve(basePath, _path);
    } else if (_path[0] === '.') {
      // if the path starts with `./` then use the full path to the file
      id = path.resolve(basePath, _path);
    } else {
      // otherwise just use the package name to be resolved with
      id = _path;
    }
    nodeResolve(id, config, (err, res) => {
      if (err) {
        // attempt to find a local version of the file
        // (e.g. less/sass/stylus all can do "@import _some-file.less")
        // and it should import locally
        // if (err.code === 'MODULE_NOT_FOUND') {
        //   return;
        // }
        return reject(err);
      }
      resolve(res);
    });
  });
}

async function recurse(entryPoint, opts, _path, allDeps = [], parent) {
  if (!_path) _path = entryPoint;
  allDeps.push(_path);
  try {
    const contents = await fs.readFile(_path, 'utf8');

    const basePath = path.dirname(_path);

    const deps = await Promise.all(
      toDeps(contents, _path, opts.precinct).map(async p => {
        const resolvedPath = await toResolvedPath(basePath, p, opts);
        // exclude core modules from attempting to be looked up
        if (
          (!opts.precinct.type ||
            !['sass', 'less', 'stylus'].includes(opts.precinct.type)) &&
          nodeResolve.isCore(resolvedPath)
        )
          return false;
        return resolvedPath;
      })
    );

    await Promise.all(
      deps
        .filter(d => d && allDeps.indexOf(d) === -1)
        .map(d => recurse(entryPoint, opts, d, allDeps, _path))
    );

    return allDeps;
  } catch (err) {
    err.parent = parent || entryPoint;
    throw err;
  }
}

async function getLatestMTimeFromDeps(deps) {
  const stats = await Promise.all(deps.map(d => fs.stat(d)));
  return stats.map(stat => stat.mtime).reduce((cur, mtime) => {
    return mtime > cur ? mtime : cur;
  }, 0);
}
