'use strict';

var path = require('path');
var fs = require('fs');
var exec = require('child_process').exec;
var helpers = require('yeoman-test');
var assert = require('yeoman-assert');

var util = require('./support/util');
var defaultAnswers = require('./support/defaultPromtAnswers');

var answers = Object.assign({},defaultAnswers, {
  "buildTool":"webpack",
  "advancedOptions": [
    "TypeScript"
  ]
});

describe('Typescript + Webpack', function () {

  this.timeout(45000);

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
        'package.json',
        'tsconfig.json',
        'webpack.config.js',
        'Gruntfile.js'
      ]);
      assert.noFile(['app/scripts/license.js']);
    })

  });

  describe('build result', function () {

    it('runs', function (done) {
      var dir = this.dir;
      util.maybeOpenInBrowser(dir,done);
    });

    it('succeeds to run production build', function (done) {
      var dir = this.dir;
      exec('npm run production', {cwd: dir}, function(error, stdout, stderr) {
        assert.ok(error === null, "Production build failed: "+stderr);
        util.maybeOpenInBrowser(dir,done);
      });
    });

  });

});
