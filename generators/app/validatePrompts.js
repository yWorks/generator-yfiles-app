const fs = require('fs')
const path = require('path')
const util = require('../utils')

const validations = {

  getMajorYfilesVersion: function(packagePath) {
    const jsonPath = path.join(packagePath, 'package.json')
    if (fs.existsSync(jsonPath)) {
      const json = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))
      const packageVersion = json.version
      return parseInt(packageVersion.substring(0, packageVersion.indexOf('.')))
    }
    return null
  },

  isValidYfilesPackage: function(p) {
    if (!fs.existsSync(p)) {
      return "This path does not exist"
    } else {
      const majorVersion = validations.getMajorYfilesVersion(p)

      const hasES6Modules = fs.existsSync(path.join(p, "lib", "es-modules"))
      const hasOldModules = fs.existsSync(path.join(p, "lib", "umd"))
      const hasTools = fs.existsSync(path.join(p, "tools"))
      const hasPreparePackage = fs.existsSync(path.join(p, "tools", "prepare-package"))
      const hasIdeSupport = fs.existsSync(path.join(p, "ide-support"))
      if (!hasPreparePackage && !hasES6Modules && hasOldModules) {
        return "This generator works with yFiles 2.3 packages (or later). For older packages, use a previous release of the generator."
      } else if (majorVersion !== null && majorVersion > 24) {
        return "Please use yworks.com/app-generator for yFiles for HTML 2.5 or newer."
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
