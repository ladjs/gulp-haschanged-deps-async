const path = require('path');
const fs = require('fs-extra');
const nodeResolve = require('resolve');
const precinct = require('precinct');
const debug = require('debug')('gulp-haschanged-deps');
const PluginError = require('plugin-error');

module.exports = function(opts = {}) {
  opts = Object.assign(
    {
      allowMissingDeps: true,
      precinct: {}
    },
    opts
  );

  return async function(stream, sourceFile, destPath) {
    debug('sourceFile.path', sourceFile.path, 'destPath', destPath);
    try {
      const deps = await recurse(sourceFile.path, opts.precinct);
      debug('deps', deps);

      const sourceMTime = await getLatestMTimeFromDeps(deps);
      debug('sourceMTime', sourceMTime);

      debug(
        'Got deps for `' + sourceFile.path + '`',
        deps,
        'Latest mtime',
        sourceMTime
      );

      const targetStat = await fs.stat(destPath);

      debug('Target', destPath, 'mtime', targetStat && targetStat.mtime);

      if (!targetStat || sourceMTime >= targetStat.mtime)
        stream.push(sourceFile);
    } catch (err) {
      debug('Target', destPath, 'err', err);
      if (!opts.allowMissingDeps) {
        const obj = { fileName: sourceFile.path };
        if (err.parent) obj.parent = err.parent;
        stream.emit('error', new PluginError('gulp-haschanged-deps', err, obj));
      }
    }
  };
};

function toDeps(contents, path, precinctOpts) {
  return precinct(contents, precinctOpts);
}

function toResolvedPath(basePath, _path) {
  return new Promise((resolve, reject) => {
    nodeResolve(path.resolve(basePath, _path), (err, res) => {
      // TODO: do we want to throw error?
      if (err) return reject(err);
      resolve(res);
    });
  });
}

function recurse(entryPoint, precinctOpts, _path, allDeps = [], parent) {
  debug('entryPoint', entryPoint, '_path', _path);
  if (!_path) _path = entryPoint;
  allDeps.push(_path);
  debug(
    'recurse',
    'entryPoint',
    entryPoint,
    'precinctOpts',
    precinctOpts,
    '_path',
    path,
    'allDeps',
    allDeps,
    'parent',
    parent
  );
  return new Promise(async (resolve, reject) => {
    try {
      const contents = await fs.readFile(_path, 'utf8');

      const basePath = path.dirname(_path);

      const deps = await Promise.all(
        toDeps(contents, _path, precinctOpts).map(p => {
          return new Promise(async (resolve, reject) => {
            try {
              const resolvedPath = await toResolvedPath(basePath, p);
              // TODO: don't throw error?
              // only emit warning if it's a relative path
              if (!resolvedPath && p[0] === '.')
                throw new Error(
                  `Unable to resolve referenced path ${p} (from "${_path}")`
                );
              resolve(resolvedPath);
            } catch (err) {
              reject(err);
            }
          });
        })
      );

      await Promise.all(
        deps.filter(d => !d || allDeps.indexOf(d) !== -1).map(d => {
          return recurse(entryPoint, precinctOpts, d, allDeps, _path);
        })
      );

      resolve(allDeps);
    } catch (err) {
      // TODO: resolve(allDeps);
      err.parent = parent || entryPoint;
      reject(err);
    }
  });
}

async function getLatestMTimeFromDeps(deps) {
  const stats = await Promise.all(deps.map(d => fs.stat(d)));
  stats.map(stat => stat.mtime).reduce((cur, mtime) => {
    return mtime > cur ? mtime : cur;
  }, 0);
}
