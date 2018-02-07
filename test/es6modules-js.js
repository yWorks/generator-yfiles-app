'use strict';

var fs = require('fs');
var exec = require('child_process').exec;
var helpers = require('yeoman-test');
var assert = require('yeoman-assert');
var opn = require('opn');

var util = require('./support/util');
var defaultAnswers = require('./support/defaultPromtAnswers');
var promptOptions = require("../generators/app/promptOptions")

var answers = Object.assign({},defaultAnswers, {
  "language": promptOptions.language.ES6,
  "moduleType": promptOptions.moduleType.ES6_MODULES
});


describe('ES6Modules JS', function () {

  this.timeout(55000);

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
      })
  });

  describe('check files', function() {
    it('generates base files', function () {
      assert.file([
        'app/index.html',
        'app/scripts/app.js',
        'app/styles/yfiles.css',
        'package.json',
        'webpack.config.js',
        'Gruntfile.js'
      ]);
      assert.noFile([
        'app/lib/complete.js',
        'bower.json',
        'tsconfig.json',
        'jsconfig.json',
        'app/scripts/license.js'
      ]);
    });

  });

  describe('build result', function() {

    it('runs', function (done) {
      util.maybeOpenInBrowser(this.dir,done);
    });

  });

});
