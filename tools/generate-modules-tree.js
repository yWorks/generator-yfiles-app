const path = require('path')
const fs = require('fs')

const packageRoot = require('../localconfig').yfilesPath
const libRoot = path.join(packageRoot,'lib/umd/yfiles')
const metaModules = fs.readdirSync(libRoot).filter(fileName => /\.js$/.test(fileName) && fileName.indexOf('lang') === -1 && fileName.indexOf('shim') === -1)
const implRoot = path.join(libRoot,'impl')
const implModules = fs.readdirSync(implRoot).filter(fileName => /\.js$/.test(fileName) && fileName.indexOf('lang') === -1)

const generateES6Modules = require('./generate-es6-modules')

const moduleData = {}
metaModules.forEach(metaFile => {
  const r = {
    implDeps: [],
    metaDeps: [],
    isMeta: true
  }
  const modulePath = path.join(libRoot, metaFile)
  let content = fs.readFileSync(modulePath, {encoding: "utf8"})
  function define(deps, callback) {
    deps.forEach(dep => {
      if(dep.indexOf('lang') === -1) {
        if (path.dirname(dep) === './impl') {
          r.implDeps.push(`yfiles/impl/${path.basename(dep)}`)
        } else {
          r.metaDeps.push(`yfiles/${path.basename(dep)}`)
        }
      }
    })
  }
  define.amd = true
  eval(content)

  moduleData[`yfiles/${path.basename(metaFile, '.js')}`] = r
})

implModules.forEach(implFile => {
  const r = {
    implDeps: [],
    metaDeps: [],
    isMeta: false
  }
  const modulePath = path.join(implRoot, implFile)
  let content = fs.readFileSync(modulePath, {encoding: "utf8"})
  function define(deps, callback) {
    deps.forEach(dep => {
      if(dep.indexOf('lang') === -1) {
        r.implDeps.push(`yfiles/impl/${path.basename(dep)}`)
      }
    })
  }
  define.amd = true
  eval(content)

  moduleData[`yfiles/impl/${path.basename(implFile, '.js')}`] = r
})

const metaModulesJSON = {}
Object.keys(moduleData).forEach(moduleName => {
  const info = moduleData[moduleName]
  if(info.isMeta) {
    metaModulesJSON[moduleName] = info.metaDeps
  }
})

/**
 * Collect transitive deps as inefficiently as possible
 */
function collectDeps(moduleName, allDeps) {
  const moduleInfo = moduleData[moduleName]

  moduleInfo.implDeps.forEach(implDep => {
    if(allDeps.indexOf(implDep) === -1) {
      allDeps.push(implDep)
    }
  })
  moduleInfo.metaDeps.forEach(implDep => {
    if(allDeps.indexOf(implDep) === -1) {
      allDeps.push(implDep)
    }
  })
  moduleInfo.implDeps.forEach(implDep => {
    collectDeps(implDep, allDeps)
  })
  moduleInfo.metaDeps.forEach(metaDep => {
    collectDeps(metaDep, allDeps)
  })
}

Object.keys(moduleData).forEach(moduleName => {
  const transitiveDeps = []
  collectDeps(moduleName, transitiveDeps)
  moduleData[moduleName].transitiveDeps = transitiveDeps
})

const scriptModulesJSON = {}
Object.keys(moduleData).forEach(moduleName => {
  const info = moduleData[moduleName]
  let moduleDeps = new Set(info.metaDeps.concat(info.implDeps))
  // remove transitive deps
  moduleDeps.forEach(dep => {
    moduleData[dep].transitiveDeps.forEach(transitiveDep => {
      moduleDeps.delete(transitiveDep)
    })
  })
  moduleDeps = Array.from(moduleDeps)
  scriptModulesJSON[moduleName] = moduleDeps
})

fs.writeFileSync(path.join(__dirname,'yfiles-modules.json'),JSON.stringify(metaModulesJSON,null,2),{encoding: 'utf8'})
fs.writeFileSync(path.join(__dirname,'yfiles-script-modules.json'),JSON.stringify(scriptModulesJSON,null,2),{encoding: 'utf8'})

console.log(JSON.stringify(moduleData,null,2))

let es6Map = generateES6Modules()
fs.writeFileSync(path.join(__dirname,'yfiles-es6-modules.json'),JSON.stringify(es6Map,null,2),{encoding: 'utf8'})
