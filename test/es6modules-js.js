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
        'app/scripts/license.js',
        'app/typings/yfiles-api-umd-vscode.d.ts',
        'app/typings/yfiles-api-umd-webstorm.d.ts',
        'app/typings/yfiles-api-es6-modules-vscode.d.ts',
        'app/typings/yfiles-api-es6-modules-webstorm.d.ts'
      ]);
    });

  });

  describe('build result', function() {

    it('created the bundles and sourcemaps', function() {
      assert.file([
        'app/dist/app.js',
        'app/dist/app.js.map',
        'app/dist/lib.js',
        'app/dist/manifest.js'
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
