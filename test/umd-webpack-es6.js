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
  "moduleType": promptOptions.moduleType.UMD,
  "language": promptOptions.language.ES6,
  "buildTool": promptOptions.buildTool.WEBPACK
});


describe('UMD + Webpack + ES6', function () {

  this.timeout(100000);

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
        'package.json',
        'webpack.config.js',
      ]);
      assert.noFile([
        'bower.json',
        'tsconfig.json',
        'app/scripts/license.json',
        'Gruntfile.js',
        '.idea/jsLibraryMappings.xml',
        '.idea/misc.xml',
        '.idea/modules.xml',
        '.idea/testApp.iml',
        '.idea/libraries/yFiles_for_HTML.xml',
        'app/scripts/yfiles-typeinfo.js'
      ]);
    });

  });

  describe('build result', function() {

    it('installed npm files', function() {
      assert.file([
        'node_modules/@yworks/optimizer/index.js'
      ]);
    });

    it('runs', function (done) {
      util.maybeOpenInBrowser(this.dir,done);
    });

    it('succeeds to run production build', function (done) {
      // takes some time, because yfiles/complete is bundled
      const dir = this.dir;
      exec('npm run production', {cwd: dir}, function(error, stdout, stderr) {
        assert.ok(error === null, "Production build failed: "+stderr);
        util.maybeOpenInBrowser(dir,done);
      });
    });

  });

});
