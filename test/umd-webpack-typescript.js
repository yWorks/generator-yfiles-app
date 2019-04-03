'use strict';

const path = require('path');
const fs = require('fs');
const exec = require('child_process').exec;
const helpers = require('yeoman-test');
const assert = require('yeoman-assert');

const util = require('./support/util');
const defaultAnswers = require('./support/defaultPromptAnswers');
const promptOptions = require("../generators/app/promptOptions");
const defaultInit = require('./support/defaultInit');

const answers = Object.assign({},defaultAnswers, {
  "moduleType": promptOptions.moduleType.UMD,
  "buildTool": promptOptions.buildTool.WEBPACK,
  "language": promptOptions.language.TypeScript
});

describe('UMD + Webpack + Typescript', function () {

  this.timeout(120000);

  before(function(done) {
    const that = this;
    helpers
      .run(require.resolve('../generators/app'))
      .withGenerators([[helpers.createDummyGenerator(), require.resolve('../generators/class')]])
      .withOptions({
        'skip-welcome-message': true,
        'skip-message': true,
        'skip-install': false
      })
      .withPrompts(answers).then(function(dir) {return defaultInit(__filename, dir)}).then(function(dir) {
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
        'app/typings/yfiles-api-umd-vscode.d.ts',
        'package.json',
        'tsconfig.json',
        'webpack.config.js'
      ]);
      assert.noFile(['app/scripts/license.json',
        'app/styles/yfiles.css',
        'app/scripts/yfiles-typeinfo.js']);
    })

  });

  describe('build result', function () {

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
    it('uses ts-loader 4', function() {
      assert.fileContent('package.json', /"ts-loader": "\^?4/)
    })

    it('runs', function (done) {
      const dir = this.dir;
      util.maybeOpenInBrowser(dir,done);
    });

    it('succeeds to run production build', function (done) {
      const dir = this.dir;
      exec('npm run production', {cwd: dir}, function(error, stdout, stderr) {
        assert.ok(error === null, "Production build failed: "+stderr);
        util.maybeOpenInBrowser(dir,done);
      });
    });

  });

});
