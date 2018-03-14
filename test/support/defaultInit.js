var path = require('path');

module.exports = function(testfile, dir) {
  return new Promise(function(resolve, reject) {
    console.log("Running %s in %s", path.basename(testfile, '.js'), dir)
    resolve(dir)
  })
}
