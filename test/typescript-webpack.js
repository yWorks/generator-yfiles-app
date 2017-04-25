'use strict';

var path = require('path');
var fs = require('fs');
var exec = require('child_process').exec;
var helpers = require('yeoman-test');
var assert = require('yeoman-assert');
var openIndexInBrowser = !!process.env.OPEN_IN_BROWSER;
var localConfig = require('./getLocalConfig');

var answers = {
  "applicationName": "testApp",
  "module": "testModule",
  "yfilesPath": localConfig.yfilesPath,
  "licensePath": path.resolve(localConfig.yfilesPath, 'demos/resources/license.js'),
  "buildTool": "Grunt + Webpack",
  "modules": ["yfiles/complete"],
  "advancedOptions": [
    "TypeScript"
  ]
};

describe('yfiles:typescript-webpack', function () {

  this.timeout(35000);

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
        'webpack.config.js',
        'Gruntfile.js'
      ]);
      assert.noFile(['app/scripts/license.js']);
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
      if (openIndexInBrowser) {
        var indexHtml = path.resolve(dir, 'app/index.html');
        opn(indexHtml).then(function (childProcess) {
          done();
        }, function (err) {
          console.log(err);
          done();
        })
      } else {
        done();
      }
    });

    it('succeeds to run production build', function (done) {
      var dir = this.dir;
      exec('npm run production', {cwd: dir}, function(error, stdout, stderr) {
        assert.ok(error === null, "Production build failed: "+stderr);

      });
    });

  });

});
