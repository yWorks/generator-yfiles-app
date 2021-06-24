'use strict';

const fs = require('fs');
const exec = require('child_process').exec;
const helpers = require('yeoman-test');
const assert = require('yeoman-assert');

const util = require('./support/util');
const defaultAnswers = require('./support/defaultPromptAnswers');
const promptOptions = require("../generators/app/promptOptions");
const defaultInit = require('./support/defaultInit');
const initTest = require('./support/initTest');

const answers = Object.assign({},defaultAnswers, {
  "moduleType": promptOptions.moduleType.NPM,
  "language": promptOptions.language.TypeScript,
  "advancedOptions": [
    promptOptions.advanced.DEVLIB
  ]
});


describe('Local NPM module + TypeScript', function () {

  this.timeout(125000)

  before(initTest(answers))

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
        'app/scripts/app.ts',
        'package.json',
        'tsconfig.json',
        'webpack.config.js',
        'node_modules/yfiles/yfiles.js',
        'node_modules/yfiles/typings/yfiles-api-ts43.d.ts'
      ]);
      assert.noFile([
        'bower.json',
        'app/shim/es2015-shim.js',
        'jsconfig.json',
        'app/styles/yfiles.css',
        'app/scripts/license.json',
        'app/typings/yfiles-api-umd-ts43-vscode.d.ts',
        'app/typings/yfiles-api-umd-ts43-webstorm.d.ts',
        'app/typings/yfiles-api-modules-ts43-vscode.d.ts',
        'app/typings/yfiles-api-modules-ts43-webstorm.d.ts',
        'Gruntfile.js',
        'app/lib/yfiles/yfiles.js',
      ]);
    });

  });

  describe('build result', function() {

    it('created the bundles and sourcemaps', function() {
      assert.file([
        'app/dist/app.js',
        'app/dist/app.js.map',
        'app/dist/lib.js'
      ]);
    });

    it('uses webpack 4', function() {
      assert.fileContent('package.json', /"webpack": "\^?4/)
    })

    it('runs', function (done) {
      util.maybeOpenInBrowser(this.dir,done);
    });

    it('succeeds to run production build', function (done) {
      const dir = this.dir;
      exec('npm run production', {cwd: dir.cwd}, function(error, stdout, stderr) {
        assert.ok(error === null, "Production build failed: "+error);
        util.maybeOpenInBrowser(dir,done);
      });
    });

  });

});
