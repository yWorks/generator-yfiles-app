var fs = require('fs')
var path = require('path')
var util = require('../utils')

var validations = {

  isValidYfilesPackage: function(p) {
    if (!fs.existsSync(p)) {
      return "This path does not exist"
    } else {
      var hasES6Modules = fs.existsSync(path.join(p, "lib", "es-modules"))
      var hasOldModules = fs.existsSync(path.join(p, "lib", "umd"))
      if (!hasES6Modules && hasOldModules) {
        return "This generator works with yFiles 2.2 packages (or later). For older packages, use a previous release of the generator."
      } else if (!hasES6Modules && !hasOldModules) {
        return "Not a valid yFiles package"
      }
      return true
    }
  },

  isValidYfilesLicense: function(p) {
    if(!fs.existsSync(p)) {
      return "The license file was not found at the specified location."
    } else {
      var parsedLicense = util.parseLicense(p);
      if(!parsedLicense || !parsedLicense.key || !parsedLicense.product || !(parsedLicense.product === 'yFiles for HTML')) {
        return "The provided file does not appear to be a valid yFiles for HTML license file."
      } else {
        return true;
      }
    }
  }

}

module.exports = validations
