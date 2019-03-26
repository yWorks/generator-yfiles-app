const fs = require('fs')
const path = require('path')

const findES6Deps = function() {
  const packageRoot = require('../localconfig').yfilesPath
  const libRoot = path.join(packageRoot,'lib/es-modules')
  const es6Modules = fs.readdirSync(libRoot).filter(fileName => /\.js$/.test(fileName) && fileName.indexOf('lang') === -1)

  const moduleData = {}
  es6Modules.forEach(es6Module => {
    const deps = []
    const moduleName = 'yfiles/'+es6Module.replace(/(.*)\.js/,'$1')
    moduleData[moduleName] = deps
    const content = fs.readFileSync( path.join(libRoot, es6Module),{encoding:'utf8'})
    const re = /import\s?(?:\w+\sfrom\s?)?["']([^;]+)["'];/g
    let match
    while(match = re.exec(content)) {
      if(match[1].indexOf('lang') === -1) {
        const dep = 'yfiles/'+match[1].replace(/^\.\/(.*)\.js$/,"$1")
        deps.push(dep)
      }
    }
  })
  return moduleData
}

module.exports = findES6Deps
