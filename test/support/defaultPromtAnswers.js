'use strict';

var path = require('path');
var localConfig = require('./getLocalConfig');
var validatePrompts = require('../../generators/app/validatePrompts')
var assert = require('yeoman-assert');

const yfilesPath = localConfig.yfilesPath
const licensePath = path.resolve(yfilesPath, 'demos/resources/license.js')
var answers = {
  "applicationName": "testApp",
  "module": "testModule",
  "yfilesPath": yfilesPath,
  "licensePath": licensePath,
  "buildTool": "none",
  "modules": [
    "yfiles/layout-hierarchic",
    "yfiles/view-component",
    "yfiles/view-editor",
    "yfiles/view-layout-bridge"
  ],
  "language": "No",
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
