'use strict';

var path = require('path');
var fs = require('fs');
var chalk = require("chalk");
var helpers = require('yeoman-test');
var assert = require('yeoman-assert');

try {
  var localConfig = require('../localconfig.json');
} catch(e) {
  console.log(chalk.yellow("Testing needs to know the path to a yFiles package!\n\
Please provide a localconfig.json file in the root directory:\n\
{\n\
  \"yfilesPath\":\"path/to/yfiles-package\"\n\
}"));
  return;
}


var answers = {
  "applicationName":"testApp",
  "module":"testModule",
  "yfilesPath": localConfig.yfilesPath,
  "licensePath": path.resolve(localConfig.yfilesPath,'demos/resources/license.js'),
  "buildTool":"Grunt + Webpack",
  "modules":["yfiles/complete"],
  "advancedOptions":[]
};

describe('yfiles:webpack', function () {

  console.log(answers);

  beforeEach(function () {
    this.app = helpers
      .run(require.resolve('../generators/app'))
      .withGenerators([[helpers.createDummyGenerator(),require.resolve('../generators/class')]])
      .withOptions({
        'skip-welcome-message': true,
        'skip-message': true
      })
      .withPrompts(answers);
  });

  describe('default', function () {
    beforeEach(function (done) {
      this.app.on('end', done);
    });

    it('generates base files', function () {
      assert.file([
        'app/index.html',
        'app/scripts/app.js',
        'app/styles/yfiles.css',
        'Gruntfile.js',
        'package.json',
        'webpack.config.js'
      ]);
      assert.noFile([
        'app/scripts/license.js'
      ]);
    });
  });

});
