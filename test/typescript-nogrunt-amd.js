'use strict';

var path = require('path');
var fs = require('fs');
var helpers = require('yeoman-test');
var assert = require('yeoman-assert');
var opn = require('opn');

var localConfig = require('./getLocalConfig');
var util = require('./util');

var answers = {
  "applicationName": "testApp",
  "module": "testModule",
  "yfilesPath": localConfig.yfilesPath,
  "licensePath": path.resolve(localConfig.yfilesPath, 'demos/resources/license.js'),
  "buildTool": "none",
  "loadingType": "AMD",
  "modules": ["yfiles/complete"],
  "advancedOptions": [
    "Use yfiles-typeinfo.js", "TypeScript"
  ]
};

describe('yfiles:typescript', function () {

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
        'app/index.html', 'app/scripts/app.ts', 'app/styles/yfiles.css', 'package.json', 'app/scripts/license.js'
      ]);
      assert.noFile(['Gruntfile.js', 'webpack.config.js']);
    })

  });


  describe('build result', function () {

    it('installed bower files', function() {
      assert.file([
        'bower_components/requirejs/require.js'
      ]);
    });

    it('runs', function (done) {
      var dir = this.dir;
      util.maybeOpenInBrowser(dir,done);
    });
  });

});
