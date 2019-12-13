const fs = require('fs')
const path = require('path')
const {exec} = require('child_process');

module.exports = function (answers) {
  return function (done) {
    const packagePath = answers.yfilesPath
    if (fs.existsSync(packagePath)) {
      const libPath = path.join(packagePath, 'lib/es-modules')
      const tgzFiles = fs.readdirSync(libPath).filter(f => f.endsWith('tgz')).map(f => path.join(libPath, f))
      for (const tgz of tgzFiles) {
        console.log('Cleaning ', tgz, 'yFiles package.')
        fs.unlinkSync(tgz)
      }
    }

    exec('yarn cache clean', done)
  }
}
