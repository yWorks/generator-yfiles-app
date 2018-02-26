'use strict';

var path = require('path');
var fs = require('fs');
var helpers = require('yeoman-test');
var assert = require('yeoman-assert');
var opn = require('opn');

var util = require('./support/util');
var defaultAnswers = require('./support/defaultPromptAnswers');
var promptOptions = require("../generators/app/promptOptions")

var answers = Object.assign({},defaultAnswers, {
  "buildTool": promptOptions.buildTool.NONE,
  "loadingType": promptOptions.loadingType.SYSTEMJS,
  "language": promptOptions.language.TypeScript,
  "advancedOptions": [
    "Use yfiles-typeinfo.js"
  ]
});

describe('TypeScript + SystemJS', function () {

  this.timeout(25000);

  before(function(done) {
    var that = this;
    helpers
      .run(require.resolve('../generators/app'))
      .withGenerators([[helpers.createDummyGenerator(), require.resolve('../generators/class')]])
      .withOptions({
        'skip-welcome-message': true,
        'skip-message': true,
        'skip-install': false
      })
      .withPrompts(answers).then(function(dir) {
        that.dir = dir;
        console.log("temp dir", dir);
        done();
      });
    });

  describe('check files', function () {

    it('generates base files', function () {
      assert.file([
        'app/index.html',
        'app/scripts/app.ts',
        'app/styles/yfiles.css',
        'app/typings/yfiles-api-umd-vscode.d.ts',
        'package.json',
        'tsconfig.json'
      ]);
      assert.noFile([
        'bower.json',
        'Gruntfile.js',
        'app/scripts/license.js',
        'webpack.config.js'
      ]);
    })

  });


  describe('build result', function () {

    it('installed package.json files', function() {
      assert.file([
        'node_modules/systemjs/dist/system.js'
      ]);
    });

    it('created typescript output', function() {
      assert.file([
        'app/scripts/app.js'
      ]);
    });

    it('runs', function (done) {
      var dir = this.dir;
      util.maybeOpenInBrowser(dir,done);
    });
  });

});
