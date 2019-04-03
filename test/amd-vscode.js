'use strict';

const fs = require('fs');
const exec = require('child_process').exec;
const helpers = require('yeoman-test');
const assert = require('yeoman-assert');
const opn = require('opn');

const util = require('./support/util');
const defaultAnswers = require('./support/defaultPromptAnswers');
const promptOptions = require("../generators/app/promptOptions");
const defaultInit = require('./support/defaultInit');

const answers = Object.assign({},defaultAnswers, {
  "buildTool": promptOptions.buildTool.NONE,
  "loadingType": promptOptions.loadingType.AMD,
  "advancedOptions": [
    promptOptions.advanced.VSCODE,
    promptOptions.advanced.TYPEINFO
  ]
});


describe('AMD + VS Code', function () {

  this.timeout(125000)

  before(function(done) {
    const that = this;
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
        'app/styles/yfiles.css',
        'jsconfig.json',
        'package.json',
        'app/scripts/yfiles-typeinfo.js'
      ]);
      assert.noFile([
        'bower.json',
        'tsconfig.json',
        'Gruntfile.js',
        'app/scripts/license.json',
        'webpack.config.js'
      ]);
    });

  });

  describe('build result', function() {

    it('installed package.json files', function() {
      assert.file([
        'node_modules/requirejs/require.js'
      ]);
    });

    it('runs', function (done) {
      util.maybeOpenInBrowser(this.dir,done);
    });

  });

});
