const fs = require('fs')
const path = require('path')
const util = require('../utils')

const validations = {

  isValidYfilesPackage: function(p) {
    if (!fs.existsSync(p)) {
      return "This path does not exist"
    } else {
      const hasES6Modules = fs.existsSync(path.join(p, "lib", "es-modules"))
      const hasOldModules = fs.existsSync(path.join(p, "lib", "umd"))
      const hasTools = fs.existsSync(path.join(p, "tools"))
      const hasIdeSupport = fs.existsSync(path.join(p, "ide-support"))
      if (!hasES6Modules && hasOldModules) {
        return "This generator works with yFiles 2.2 packages (or later). For older packages, use a previous release of the generator."
      } else if (!(hasES6Modules && hasOldModules && hasTools && hasIdeSupport)) {
        return "Not a valid yFiles package"
      }

     return true
    }
  },

  isValidYfilesLicense: function(p) {
    if(!fs.existsSync(p)) {
      return "The license file was not found at the specified location."
    } else {
      const parsedLicense = util.parseLicense(p);
      if(!parsedLicense || !parsedLicense.key || !parsedLicense.product || !(parsedLicense.product === 'yFiles for HTML')) {
        return "The provided file does not appear to be a valid yFiles for HTML license file."
      } else {
        return true;
      }
    }
  }

}

module.exports = validations
