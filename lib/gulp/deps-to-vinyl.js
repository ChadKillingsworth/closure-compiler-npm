/*
 * Copyright 2016 The Closure Compiler Authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';
var Transform = require('stream').Transform;
var File = require('vinyl');
var path = require('path');
var fs = require('fs');

/**
 * Converts a stream of file description objects from the
 * module-deps package to a stream of vinyl files.
 *
 * If a dependency from a module deps file has a
 * package.json file "main" entry, include the
 * package.json in the files.
 *
 * @constructor
 * @param {Object<string, {file:string, source:string}>} packages map of
 *     needed package.json files
 */
function ModuleDepsToVinyl(packages) {
  Transform.call(this, {objectMode: true});
  this._filelist = [];
  this._packages = packages;
}
ModuleDepsToVinyl.prototype = Object.create(Transform.prototype);

ModuleDepsToVinyl.prototype._transform = function(data, encoding, cb) {
  this._filelist.push(data);
  cb();
};

ModuleDepsToVinyl.prototype._flush = function(cb) {
  var files = {};
  this._filelist.forEach(function(file) {
    files[file.file] = new File({
      path: file.file,
      contents: new Buffer(file.source, 'utf8')
    });
  });

  for (var packagePath in this._packages) {
    files[packagePath] = new File({
      path: packagePath,
      contents: new Buffer(this._packages[packagePath].source, 'utf8')
    });
  }

  for (var file in files) {
    this.push(files[file]);
  }

  cb();
};

module.exports = ModuleDepsToVinyl;
