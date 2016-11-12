/*
 * Copyright 2015 The Closure Compiler Authors.
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

/**
 * @fileoverview Tests for grunt-google-closure-compiler plugin
 *
 * @author Chad Killingsworth (chadkillingsworth@gmail.com)
 */

'use strict';

process.on('unhandledRejection', reason => {
  throw reason;
});

var should = require('should');
var fs = require('fs');
var _ = require('lodash');
require('mocha');

var assertNoError = new should.Assertion('grunt');
assertNoError.params = {
  operator: 'should not fail with an error',
};

var assertError = new should.Assertion('grunt');
assertError.params = {
  operator: 'should have failed with an error',
};

var assertNoWarning = new should.Assertion('grunt');
assertNoWarning.params = {
  operator: 'should not log a warning',
};

/**
 * Grunt plugins are very hard to test. In this case we're passing a mock grunt object
 * that defines the properties we need in order to test the actual task.
 */
var mockGrunt = {
  log: {
    ok: function () {},
    warn: function () {}
  },
  file: {
    exists: function(path) {
      try {
        return fs.statSync(path).isFile();
      } catch (e) {
        return false;
      }
    }
  },
  fail: {
    warn: function() {}
  },
  registerMultiTask: function() {}
};

var closureCompiler = require('../').grunt(mockGrunt);


function gruntTaskOptions(options) {
  options = options || {};
  return function(defaults) {
    var opts = _.cloneDeep(defaults || {});
    _.merge(opts, options);
    return opts;
  }
}

function getGruntTaskObject(fileObj, options, asyncDone) {
  return {
    async: function() {
      return function() {
        asyncDone();
      }
    },
    options: gruntTaskOptions(options),
    files: fileObj
  };
}


describe('grunt-google-closure-compiler', function() {
  this.slow(1000);
  this.timeout(10000);

  it('should emit an error for invalid options', function(done) {
    var taskObj = getGruntTaskObject([{
      dest: 'unused.js',
      src: [__dirname + '/fixtures/one.js']
    }], {
      compilation_level: 'FOO'
    }, function() {
      assertError.fail();
      done();
    });

    var gruntWarning;
    mockGrunt.log.warn = function(msg) {
      gruntWarning = msg;
    };

    mockGrunt.fail.warn = function(err, code) {
      should(err).startWith('Compilation error');
      should(gruntWarning).not.be.eql(undefined);
      done();
    };

    closureCompiler.call(taskObj);
  });

  it('should warn if files cannot be found', function(done) {
    function taskDone() {
      should(gruntWarnings.length).be.eql(2);
      gruntWarnings[0].should.endWith('not found');
      gruntWarnings[1].should.endWith('not written because src files were empty');
      done();
    }

    var gruntWarnings = [];
    mockGrunt.log.warn = function(msg) {
      gruntWarnings.push(msg);
    };

    mockGrunt.fail.warn = function(err, code) {
      taskDone();
    };

    var taskObj = getGruntTaskObject([{
      dest: 'unused.js',
      src: ['dne.js']
    }], {
      compilation_level: 'SIMPLE'
    }, function() {
      taskDone();
    });

    closureCompiler.call(taskObj);
  });

  it('should support camel-case', function(done) {
    this.timeout(30000);
    this.slow(10000);

    var fileOneDest = 'test/out/one.js';

    function taskDone() {
      var fileOne = fs.statSync(fileOneDest);
      should(fileOne.isFile()).be.eql(true);
      should(fs.readFileSync(fileOneDest, 'utf8')).startWith('(function()');

      fs.unlinkSync(fileOneDest);
      fs.rmdirSync('test/out');
      done();
    }

    mockGrunt.log.warn = function (msg) {
      console.log(msg);
      assertNoWarning.fail();
    };

    mockGrunt.fail.warn = function (err, code) {
      assertNoError.fail();
      taskDone();
    };

    var taskObj = getGruntTaskObject([
      {src: ['test/fixtures/one.js'], dest: fileOneDest},
    ], {
      compilationLevel: 'SIMPLE',
      outputWrapper: '(function(){%output%})()'
    }, function () {
      taskDone();
    });

    closureCompiler.call(taskObj);
  });

  it('should run once for each destination', function(done) {
    this.timeout(30000);
    this.slow(10000);

    var fileOneDest = 'test/out/one.js';
    var fileTwoDest = 'test/out/two.js';

    function taskDone() {
      var fileOne = fs.statSync(fileOneDest);
      should(fileOne.isFile()).be.eql(true);
      fs.unlinkSync(fileOneDest);

      var fileTwo = fs.statSync(fileTwoDest);
      should(fileTwo.isFile()).be.eql(true);
      fs.unlinkSync(fileTwoDest);

      fs.rmdirSync('test/out');
      done();
    }

    mockGrunt.log.warn = function (msg) {
      console.log(msg);
      assertNoWarning.fail();
    };

    mockGrunt.fail.warn = function (err, code) {
      assertNoError.fail();
      taskDone();
    };

    var taskObj = getGruntTaskObject([
      {src: ['test/fixtures/one.js'], dest: fileOneDest},
      {src: ['test/fixtures/one.js', 'test/fixtures/two.js'], dest: fileTwoDest}
    ], {
      compilation_level: 'SIMPLE'
    }, function () {
      taskDone();
    });

    closureCompiler.call(taskObj);
  });

  it('should run when grunt provides no files', function(done) {
    this.timeout(30000);
    this.slow(10000);

    var fileOneDest = 'test/out/one.js';

    function taskDone() {
      var fileOne = fs.statSync(fileOneDest);
      should(fileOne.isFile()).be.eql(true);
      fs.unlinkSync(fileOneDest);

      fs.rmdirSync('test/out');
      done();
    }

    mockGrunt.log.warn = function (msg) {
      console.log(msg);
      assertNoWarning.fail();
    };

    mockGrunt.fail.warn = function (err, code) {
      assertNoError.fail();
      taskDone();
    };

    var taskObj = getGruntTaskObject([], {
      compilation_level: 'SIMPLE',
      js: 'test/fixtures/one.js',
      js_output_file: fileOneDest
    }, function () {
      taskDone();
    });

    closureCompiler.call(taskObj);
  });

  it('should support an arguments array', function(done) {
    this.timeout(30000);
    this.slow(10000);

    var fileOneDest = 'test/out/one.js';

    function taskDone() {
      var fileOne = fs.statSync(fileOneDest);
      should(fileOne.isFile()).be.eql(true);
      fs.unlinkSync(fileOneDest);

      fs.rmdirSync('test/out');
      done();
    }

    mockGrunt.log.warn = function (msg) {
      console.log(msg);
      assertNoWarning.fail();
    };

    mockGrunt.fail.warn = function (err, code) {
      assertNoError.fail();
      taskDone();
    };

    var taskObj = getGruntTaskObject([], {
      args: [
        '--compilation_level=SIMPLE',
        '--js=test/fixtures/one.js',
        '--js_output_file=' + fileOneDest
      ]
    }, function () {
      taskDone();
    });

    closureCompiler.call(taskObj);
  });

  it('should locate dependencies in node_modules', function(done) {
    this.timeout(30000);
    this.slow(10000);

    var entryPoint = 'test/fixtures/module-deps.js';
    var fileOneDest = 'test/out/one.js';

    function taskDone() {
      var fileOne = fs.statSync(fileOneDest);
      should(fileOne.isFile()).be.eql(true);
      fs.unlinkSync(fileOneDest);

      var fileOneSourceMap = fileOneDest + '.map';
      fileOne = fs.statSync(fileOneSourceMap);
      should(fileOne.isFile()).be.eql(true);
      var sourceMap = JSON.parse(fs.readFileSync(fileOneSourceMap, 'utf8'));
      should(sourceMap.sources).containEql('/test/fixtures/one.js');

      var nodeModuleSources = ['/node_modules/page/index.js', '/node_modules/isarray/index.js',
        '/node_modules/path-to-regexp/index.js'];
      nodeModuleSources = nodeModuleSources.filter(function(sourcePath) {
        for (var i = 0; i < sourceMap.sources.length; i++) {
          if (sourceMap.sources[i].indexOf(sourcePath) >= 0) {
            return false;
          }
        }
        return true;
      });

      should(nodeModuleSources.length).equal(0);
      fs.unlinkSync(fileOneSourceMap);

      fs.rmdirSync('test/out');
      done();
    }

    mockGrunt.log.warn = function (msg) {
      console.log(msg);
      assertNoWarning.fail();
    };

    mockGrunt.fail.warn = function (err, code) {
      assertNoError.fail();
      taskDone();
    };

    var taskObj = getGruntTaskObject([{
      src: [entryPoint],
      dest: fileOneDest
    }], {
      compilation_level: 'SIMPLE',
      process_common_js_modules: true,
      dependency_mode: 'STRICT',
      entry_point: '/' + entryPoint,
      create_source_map: '%outname%.map'
    }, function () {
      taskDone();
    });

    closureCompiler.updateOptions({includeDependencies: true});
    closureCompiler.call(taskObj);
  });
});
