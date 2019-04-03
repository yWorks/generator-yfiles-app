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
  "buildTool": promptOptions.buildTool.NONE,
  "loadingType": promptOptions.loadingType.SCRIPT_TAGS,
  "language": promptOptions.language.ES6,
  "advancedOptions": [
    "Use yfiles-typeinfo.js"
  ]
});


describe('UMD + None + Script-Tags + ES6', function () {

  this.timeout(125000)

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
        'app/scripts/yfiles-typeinfo.js',
        'app/styles/yfiles.css'
      ]);
      assert.noFile([
        'bower.json',
        'tsconfig.json',
        'app/scripts/license.json',
        'webpack.config.js',
        'Gruntfile.js',
        'package.json',
        '.idea/jsLibraryMappings.xml',
        '.idea/misc.xml',
        '.idea/modules.xml',
        '.idea/testApp.iml',
        '.idea/libraries/yFiles_for_HTML.xml'
      ]);
    });

  });

  describe('build result', function() {

    it('runs', function (done) {
      util.maybeOpenInBrowser(this.dir,done);
    });

  });

});
