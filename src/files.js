import _ from 'lodash';
import bluebird from 'bluebird';
import fileGlob from 'minimatch';
import fs from 'fs';
import path from 'path';
import {
  isDate,
  isNumber
} from 'unit-compare';
const fsp = bluebird.promisifyAll(fs);

function flatten(a, b) {
  return a.concat(b);
}

function hasParent(parent) {
  return parent && (parent !== '/' && parent !== '.');
}

function getParent(dir) {
  return path.dirname(dir);
}

function getExt(file) {
  return path.extname(file).substring(1);
}

function getSubDirectories(base, allPaths) {
  return allPaths
    .filter((candidate) => {
      return base !== candidate && isSubDirectory(base, candidate);
    });
}

function splitPath(dir) {
  return dir.split(path.sep);
}

export function getDepth(root, dir) {
  return pathDepth(dir) - pathDepth(root);
}

export function readFiles(dir) {
  return bluebird.resolve(fsp.readdirAsync(dir));
}

export function readFilesSync(dir) {
  return fs.readdirSync(dir);
}

export function findSubDirectories(paths) {
  return paths
    .map((path) => {
      return getSubDirectories(path, paths);
    })
    .reduce(flatten, []);
}

export function notSubDirectory(subDirs) {
  return (path) => {
    return !_.includes(subDirs, path);
  };
}

export function isSubDirectory(base, candidate) {
  let parent = candidate;
  while (hasParent(parent)) {
    if (base === parent) {
      return true;
    }
    parent = getParent(parent);
  }
  return false;
}

export function joinWith(dir) {
  return (file) => {
    return path.join(dir, file);
  };
}

export function glob(pattern) {
  return (fname) => {
    const glob = new fileGlob.Minimatch(pattern, {
      matchBase: true
    });
    return glob.match(fname);
  };
}

export function match(pattern) {
  return (fname) => {
    return new RegExp(pattern).test(fname);
  };
}

export function getStats(file) {
  return fs.statSync(file);
}

export function sizeMatcher(sizeExpression) {
  return (file) => {
    const stats = getStats(file);
    return isNumber(stats.size).assert(sizeExpression);
  };
}

export function utimeMatcher(timeExpression, utime) {
  return (file) => {
    const mtime = getStats(file)[utime];
    return isDate(mtime).assert(timeExpression);
  };
}

export function extMatcher(extension) {
  return (file) => {
    return getExt(file) === extension;
  };
}

export function isDirectory(file) {
  return getStats(file).isDirectory();
}

export function isVisibleFile(path) {
  const pathParts = splitPath(path);
  return !(/^\./).test(pathParts.pop());
}

export function pathDepth(dir) {
  return splitPath(dir).length;
}

export function isHiddenDirectory(dir) {
  return (/(^|\/)\.[^\/\.]/g).test(dir);
}

export function reducePaths(searchPaths) {
  if (searchPaths.length === 1) {
    return searchPaths;
  }

  const subDirs = findSubDirectories(searchPaths.sort());
  return searchPaths.filter(notSubDirectory(subDirs));
}

function getFiles(dir, read) {
  return read(dir).map(joinWith(dir));
}

export function getFilesSync(dir) {
  return getFiles(dir, readFilesSync);
}

export function getFilesAsync(dir) {
  return getFiles(dir, readFiles);
}
