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
  "moduleType": promptOptions.moduleType.ES6_MODULES,
  "language": promptOptions.language.ES6,
  "advancedOptions": [
    promptOptions.advanced.TYPEINFO,
    promptOptions.advanced.WEBSTORM
  ]
});


describe('ES Modules + ES6 + WebStorm', function () {

  this.timeout(55000);

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
        'app/typings/yfiles-api-es-modules-vscode.d.ts',
        'package.json',
        'webpack.config.js',
        'app/lib/yfiles/yfiles.js',
        'app/lib/es2015-shim.js',
        'app/scripts/yfiles-typeinfo.js',
        '.idea/libraries/yFiles_for_HTML.xml',
        '.idea/jsLibraryMappings.xml',
        '.idea/testApp.xml',
        '.idea/modules.xml',
        '.idea/misc.xml',
        '.idea/webResources.xml'
      ]);
      assert.noFile([
        'jsconfig.json',
        'bower.json',
        'tsconfig.json',
        'app/scripts/license.json',
        'app/typings/yfiles-api-umd-vscode.d.ts',
        'app/typings/yfiles-api-umd-webstorm.d.ts',
        'app/typings/yfiles-api-es-modules-webstorm.d.ts',
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
      const child = exec('npm run production', {cwd: dir}, function(error, stdout, stderr) {
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
