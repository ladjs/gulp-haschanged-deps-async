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
    const p = _path ? path.resolve(basePath, _path) : basePath;
    nodeResolve(p, { basedir: opts.cwd }, (err, res) => {
      if (err) return reject(err);
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
        let resolvedPath;
        if (p[0] === '.') {
          resolvedPath = await toResolvedPath(basePath, p, opts);
        } else {
          resolvedPath = await toResolvedPath(p, null, opts);
        }
        return resolvedPath;
      })
    );

    await Promise.all(
      deps.filter(d => !d || allDeps.indexOf(d) !== -1).map(d => {
        return recurse(entryPoint, opts, d, allDeps, _path);
      })
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
