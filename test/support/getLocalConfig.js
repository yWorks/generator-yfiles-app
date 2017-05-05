'use strict';

var chalk = require("chalk");

try {
  var localConfig = require('../../localconfig.json');
} catch(e) {
  console.log(chalk.yellow("Testing needs to know the path to a yFiles package!\n\
Please provide a localconfig.json file in the root directory:\n\
{\n\
  \"yfilesPath\":\"path/to/yfiles-package\"\n\
}"));
  process.exit(1);
}

module.exports = localConfig;
