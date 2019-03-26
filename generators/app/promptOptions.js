module.exports = {
  loadingType: {
    AMD: "AMD",
    SCRIPT_TAGS: "script-tags"
  },
  buildChain: {
    YARN: "yarn",
    NPM: "npm"
  },
  moduleType: {
    UMD: "UMD",
    ES6_MODULES: "ES Modules",
    NPM: "Local NPM dependency (recommended)"
  },
  buildTool: {
    NONE: "none",
    WEBPACK: "webpack"
  },
  language: {
    ES5: "ES5",
    ES6: "ES6",
    ES6Babel: "ES6 & babel",
    TypeScript: "TypeScript"
  },
  advanced: {
    TYPEINFO: "Use yfiles-typeinfo.js",
    VSCODE: "Visual Studio Code integration",
    WEBSTORM: "WebStorm/PHP-Storm/Intellij IDEA Ultimate Project files"
  }
}
