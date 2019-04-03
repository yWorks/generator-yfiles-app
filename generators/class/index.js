"use strict";
const Generator = require('yeoman-generator');
const utils = require("../utils");
const path = require("path");

module.exports = class extends Generator {
  writing() {
    const appPath = this.options.appPath || this.config.get("appPath") || "app";
    const scriptsPath = this.options.scriptsPath || this.config.get("scriptsPath") || path.join(appPath, "scripts");
    const libPath = this.options.libPath || this.config.get("libPath") || path.join(appPath, "lib");
    const stylesPath = this.options.stylesPath || this.config.get("stylesPath") || path.join(appPath, "styles");

    const buildTool = this.options.buildTool || this.config.get("buildTool") || "none";

    const language = this.options.language || this.config.get("language") || "javascript";

    const useWebpack = this.options.useWebpack;
    const useES6Modules = this.options.useES6Modules;
    const useLocalNpm = this.options.useLocalNpm;

    let indent = "";
    if (language === "es6") {
      if (this.options.loadingType === "AMD" && !useWebpack) {
        // es6+AMD: 4 spaces
        indent = "    ";
      } else {
        // es6: 2 spaces
        indent = "  ";
      }
    } else if (language === "typescript") {
      // ts: 2 spaces
      indent = "  ";
    } else if (language === "javascript") {
      if (this.options.loadingType === "AMD" && !useWebpack) {
        // js+AMD: 8 spaces
        indent = "        ";
      } else {
        // js: 6 spaces
        indent = "      ";
      }
    }

    const modules = this.config.get("modules");

    const vars = {
      name: this.options.name,
      appPath: utils.unixPath(appPath),
      scriptsPath: utils.unixPath(scriptsPath),
      layout: modules.indexOf('layout-hierarchic') >= 0 ? (useES6Modules ? 'HierarchicLayout' : 'yfiles.hierarchic.HierarchicLayout') : false,
      useShapeNodeStyle: useES6Modules ? modules.indexOf('styles-other') >= 0 : true,
      useGraphEditorInputMode: modules.indexOf('view-editor') >= 0,
      moduleList: useWebpack ? modules.map(function(module) { return '../lib/'+module.replace('yfiles/', '')}) : modules,
      useTypeInfo: this.options.useTypeInfo,
      useVsCode: this.options.useVsCode,
      useWebpack: useWebpack,
      useES6Modules: useES6Modules,
      useLocalNpm: useLocalNpm,
      content: this.options.content && this.options.content.replace(/(\n|\r\n)/gm, "$1" + indent),
      loadingType: this.options.loadingType,
      postClassContent: this.options.postClassContent && this.options.postClassContent.replace(/(\n|\r\n)/gm, "$1    "),
      description: this.options.description,
      licenseContent: this.config.get("licenseContent"),
      appScript: this.options.appScript
    };

    vars.useViewLayoutBridge = useES6Modules ? vars.layout || modules.indexOf('view-layout-bridge') >= 0 : false

    if (language === "javascript" || language === "es6") {

      let template;
      if(useES6Modules) {
        template = "applicationES6Modules.ejs"
      } else if(vars.loadingType === "AMD" && !vars.useWebpack) {
        template = "applicationAmd.ejs";
      } else if(useLocalNpm) {
        template = "applicationLocalNpm.ejs";
      } else {
        template = "application.ejs";
      }

      this.fs.copyTpl(
        this.templatePath(path.join(language, template)),
        this.destinationPath(path.join(scriptsPath, vars.appScript)),
        vars
      );
    } else {
      //
      // TypeScript
      //
      let template;
      if(useES6Modules) {
        template = "applicationES6Modules.ejs"
      } else if(useLocalNpm) {
        template = "applicationLocalNpm.ejs";
      } else {
        template = "applicationUMD.ejs";
      }

      this.fs.copyTpl(
        this.templatePath(path.join(language, template)),
        this.destinationPath(path.join(scriptsPath, vars.appScript)),
        vars
      );
    }
  }
}
