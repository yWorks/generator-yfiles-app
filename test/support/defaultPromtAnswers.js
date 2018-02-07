'use strict';

var path = require('path');
var localConfig = require('./getLocalConfig');
var validatePrompts = require('../../generators/app/validatePrompts')
var assert = require('yeoman-assert');

var promptOptions = require("../../generators/app/promptOptions")

const yfilesPath = localConfig.yfilesPath
const licensePath = path.resolve(yfilesPath, 'demos/resources/license.js')
var answers = {
  "applicationName": "testApp",
  "yfilesPath": localConfig.yfilesPath,
  "licensePath": path.resolve(localConfig.yfilesPath, 'demos/resources/license.js'),
  "moduleType": promptOptions.moduleType.UMD,
  "buildTool": promptOptions.buildTool.NONE,
  "modules": [
    "yfiles/layout-hierarchic",
    "yfiles/view-component",
    "yfiles/view-editor",
    "yfiles/view-layout-bridge"
  ],
  "language": promptOptions.language.ES5,
  "advancedOptions": []
};

describe('Validate Prompts', function () {
  it('is a valid yFiles package', function () {
    const validatePackageResult = validatePrompts.isValidYfilesPackage(yfilesPath)
    assert((typeof validatePackageResult) !== "string", validatePackageResult)
  })
  it('is a valid license', function () {
    const validateLicenseResult = validatePrompts.isValidYfilesLicense(licensePath)
    assert((typeof validateLicenseResult) !== "string", validateLicenseResult)
  })
})

module.exports = answers;
