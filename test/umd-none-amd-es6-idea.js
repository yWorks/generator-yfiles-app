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
const initTest = require('./support/initTest');

const answers = Object.assign({},defaultAnswers, {
  "moduleType": promptOptions.moduleType.UMD,
  "buildTool": promptOptions.buildTool.NONE,
  "loadingType": promptOptions.loadingType.AMD,
  "language": promptOptions.language.ES6,
  "advancedOptions": [
    promptOptions.advanced.TYPEINFO,
    promptOptions.advanced.WEBSTORM
  ]
});


describe('AMD + Pure ES6 + IDEA', function () {

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
        'app/styles/yfiles.css',
        '.idea/jsLibraryMappings.xml',
        '.idea/misc.xml',
        '.idea/modules.xml',
        '.idea/testApp.iml',
        '.idea/libraries/yFiles_for_HTML.xml',
        'package.json',
        'app/scripts/yfiles-typeinfo.js'
      ]);
      assert.noFile([
        'bower.json',
        'tsconfig.json',
        'app/scripts/license.json',
        'webpack.config.js',
        'Gruntfile.js',
      ]);
    });

  });

  describe('build result', function() {

    it('installed npm files', function() {
      assert.file([
        'node_modules/requirejs/require.js'
      ]);
    });

    it('runs', function (done) {
      util.maybeOpenInBrowser(this.dir,done);
    });

  });

});
