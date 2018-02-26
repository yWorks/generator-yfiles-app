'use strict';

var fs = require('fs');
var exec = require('child_process').exec;
var helpers = require('yeoman-test');
var assert = require('yeoman-assert');
var opn = require('opn');

var util = require('./support/util');
var defaultAnswers = require('./support/defaultPromptAnswers');
var promptOptions = require("../generators/app/promptOptions")

var answers = Object.assign({},defaultAnswers, {
  "language": promptOptions.language.TypeScript,
  "moduleType": promptOptions.moduleType.ES6_MODULES,
  "advancedOptions": [
    promptOptions.advanced.VSCODE
  ]
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
        'app/scripts/app.ts',
        'app/styles/yfiles.css',
        'app/typings/yfiles-api-es6-modules-vscode.d.ts',
        'package.json',
        'tsconfig.json',
        'webpack.config.js',
        'Gruntfile.js'
      ]);
      assert.noFile([
        'app/lib/complete.js',
        'bower.json',
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
