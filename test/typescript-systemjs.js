'use strict';

var path = require('path');
var fs = require('fs');
var helpers = require('yeoman-test');
var assert = require('yeoman-assert');
var opn = require('opn');

var util = require('./support/util');
var defaultAnswers = require('./support/defaultPromtAnswers');

var answers = Object.assign({},defaultAnswers, {
  "buildTool":"none",
  "loadingType": "systemjs",
  "advancedOptions": [
    "Use yfiles-typeinfo.js", "TypeScript"
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
        'package.json',
        'bower.json',
        'tsconfig.json'
      ]);
      assert.noFile([
        'Gruntfile.js',
        'app/scripts/license.js',
        'webpack.config.js'
      ]);
    })

  });


  describe('build result', function () {

    it('installed bower files', function() {
      assert.file([
        'bower_components/system.js/dist/system.js'
      ]);
    });

    it('created typescript output', function() {
      assert.file([
        'app/scripts/app.ts'
      ]);
    });

    it('runs', function (done) {
      var dir = this.dir;
      util.maybeOpenInBrowser(dir,done);
    });
  });

});
