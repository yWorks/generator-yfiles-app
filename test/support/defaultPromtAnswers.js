'use strict';

var path = require('path');
var localConfig = require('./getLocalConfig');

var answers = {
  "applicationName": "testApp",
  "module": "testModule",
  "yfilesPath": localConfig.yfilesPath,
  "licensePath": path.resolve(localConfig.yfilesPath, 'demos/resources/license.js'),
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

module.exports = answers;
