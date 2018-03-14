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
  "buildTool": promptOptions.buildTool.GRUNT,
  "loadingType": promptOptions.loadingType.AMD,
  "language": promptOptions.language.ES6Babel
});


describe('Grunt + AMD + ES6', function () {

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
        'app/scripts/app.es6',
        'app/styles/yfiles.css',
        'Gruntfile.js',
        'package.json',
      ]);
      assert.noFile([
        'bower.json',
        'app/scripts/license.js',
        'webpack.config.js',
        'tsconfig.json'
      ]);
    });

  });

  describe('build result', function() {

    it('installed package.json files', function() {
      assert.file([
        'node_modules/requirejs/require.js'
      ]);
    });

    it('transpiled to es5', function() {
      assert.file([
        'app/scripts/app.js'
      ]);
    });

    it('runs', function (done) {
      util.maybeOpenInBrowser(this.dir,done);
    });

    it('succeeds to run production build', function (done) {
      var dir = this.dir;
      exec('npm run production', {cwd: dir}, function(error, stdout, stderr) {
        assert.ok(error === null, "Production build failed: "+error);
        util.maybeOpenInBrowser(dir,done,"dist/index.html");
      });
    });
  });

});
