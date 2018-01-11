'use strict';

var path = require('path');
var fs = require('fs');
var exec = require('child_process').exec;
var helpers = require('yeoman-test');
var assert = require('yeoman-assert');
var opn = require('opn');

var util = require('./support/util');
var defaultAnswers = require('./support/defaultPromtAnswers');

var answers = Object.assign({},defaultAnswers, {
  "buildTool":"webpack",
  "language": "ECMAScript 6 & babel"
});

describe('Webpack And ES6', function () {

  this.timeout(60000);

  before(function(done) {
    var that = this;
    this.app = helpers
      .run(require.resolve('../generators/app'))
      .withGenerators([[helpers.createDummyGenerator(),require.resolve('../generators/class')]])
      .withOptions({
        'skip-welcome-message': true,
        'skip-message': true,
        'skip-install': false
      })
      .withPrompts(answers).then(function(dir) {
        that.dir = dir;
        done();
      }).catch(done);
  });

  describe('check files', function() {
    it('generates base files', function () {
      assert.file([
        'app/index.html',
        'app/scripts/app.es6',
        'app/styles/yfiles.css',
        'Gruntfile.js',
        'package.json',
        'webpack.config.js'
      ]);
      assert.noFile([
        'app/scripts/license.js'
      ]);
    });

  });

  describe('build result', function() {

    it('created the bundle', function() {
      assert.file([
        'app/dist/bundle.js'
      ]);
    });

    it('runs', function (done) {
      util.maybeOpenInBrowser(this.dir,done);
    });

    it('succeeds to run production build', function (done) {
      var dir = this.dir;
      exec('npm run production', {cwd: dir}, function(error, stdout, stderr) {
        assert.ok(error === null, "Production build failed: "+error);
        util.maybeOpenInBrowser(dir,done);
      });
    });
  });

});
