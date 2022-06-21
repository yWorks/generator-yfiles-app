'use strict';

const path = require('path');
const exec = require('child_process').exec;
const helpers = require('yeoman-test');
const assert = require('yeoman-assert');

const util = require('./support/util');
const { getStarterKitName } = require('../generators/utils');
const defaultAnswers = require('./support/defaultPromptAnswers');
const promptOptions = require("../generators/app/promptOptions");
const defaultInit = require('./support/defaultInit');
const initTest = require('./support/initTest');


const answers = Object.assign({},defaultAnswers, {
  "projectType": promptOptions.projectType.ANGULAR,
  "buildChain": promptOptions.buildChain.NPM,
});


describe('Angular', function () {

  this.timeout(250000)

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

  it('builds', function(done) {
    const dir = this.dir;
    const starterKitDir = path.join(dir.cwd, getStarterKitName(answers.projectType))
    console.log(`running build in ${starterKitDir}`)
    exec('npm run build', {cwd: starterKitDir}, function(error, stdout, stderr) {
      console.log("\nbuild done!")
      if (error) {
        console.log(stdout)
        console.error(stderr)
      }
      assert.ok(error === null, "Production build failed: "+error);
      done()
    });
  });

});
