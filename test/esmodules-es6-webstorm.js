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
  "moduleType": promptOptions.moduleType.ES6_MODULES,
  "language": promptOptions.language.ES6,
  "advancedOptions": [
    promptOptions.advanced.DEVLIB,
    promptOptions.advanced.WEBSTORM
  ]
});


describe('ES Modules + ES6 + WebStorm', function () {

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
        'app/scripts/app.js',
        'app/typings/yfiles-api-modules-ts43-webstorm.d.ts',
        'package.json',
        'webpack.config.js',
        'app/lib/yfiles/yfiles.js',
        '.idea/libraries/yFiles_for_HTML.xml',
        '.idea/jsLibraryMappings.xml',
        '.idea/testApp.iml',
        '.idea/modules.xml',
        '.idea/misc.xml',
        '.idea/webResources.xml'
      ]);
      assert.noFile([
        'app/lib/es2015-shim.js',
        'app/styles/yfiles.css',
        'jsconfig.json',
        'bower.json',
        'tsconfig.json',
        'app/scripts/license.json',
        'app/typings/yfiles-api-umd-ts43-vscode.d.ts',
        'app/typings/yfiles-api-umd-ts43-webstorm.d.ts',
        'Gruntfile.js'
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
      const child = exec('npm run production', {cwd: dir.cwd}, function(error, stdout, stderr) {
        console.log("\nbuild done!")
        assert.ok(error === null, "Production build failed: "+error);
        util.maybeOpenInBrowser(dir,done);
      });
      child.stdout.on('data', function(data) {
        console.log(data.toString());
      });
    });

  });

});
