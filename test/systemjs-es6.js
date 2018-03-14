'use strict';

var fs = require('fs');
var exec = require('child_process').exec;
var helpers = require('yeoman-test');
var assert = require('yeoman-assert');
var opn = require('opn');

var util = require('./support/util');
var defaultAnswers = require('./support/defaultPromptAnswers');
var promptOptions = require("../generators/app/promptOptions");
var defaultInit = require('./support/defaultInit');

var answers = Object.assign({},defaultAnswers, {
  "loadingType": promptOptions.loadingType.SYSTEMJS,
  "language": promptOptions.language.ES6Babel,
  "advancedOptions": [
    "Use yfiles-typeinfo.js"
  ]
});

console.log(JSON.stringify(answers,null,2));

describe('SystemJS + ES6', function () {

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
      .withPrompts(answers).then(function(dir) {return defaultInit(__filename, dir)}).then(function(dir) {
        that.dir = dir;
        done();
      })
  });

  describe('check files', function() {
    it('generates base files', function () {
      assert.file([
        'app/index.html',
        'app/scripts/app.js',
        'app/scripts/yfiles-typeinfo.js',
        'app/styles/yfiles.css',
        'package.json'
      ]);
      assert.noFile([
        'bower.json',
        'app/scripts/license.js',
        'webpack.config.js',
        'tsconfig.json',
        'Gruntfile.js',
        'app/typings/yfiles-api-umd-vscode.d.ts',
        'app/typings/yfiles-api-umd-webstorm.d.ts',
        'app/typings/yfiles-api-es6-modules-vscode.d.ts',
        'app/typings/yfiles-api-es6-modules-webstorm.d.ts'
      ]);
    });

  });

  describe('build result', function() {

    it('installed package.json files', function() {
      assert.file([
        'node_modules/systemjs/dist/system.js'
      ]);
    });

    it('runs', function (done) {
      util.maybeOpenInBrowser(this.dir,done);
    });
  });

});
