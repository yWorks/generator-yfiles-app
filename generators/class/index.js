"use strict";
var yeoman = require("yeoman-generator");
var yosay = require("yosay");
var utils = require("../utils");
var path = require("path");

module.exports = yeoman.extend({
  writing: function () {
    var appPath = this.options.appPath || this.config.get("appPath") || "app";
    var scriptsPath = this.options.scriptsPath || this.config.get("scriptsPath") || path.join(appPath, "scripts");
    var libPath = this.options.libPath || this.config.get("libPath") || path.join(appPath, "lib");
    var stylesPath = this.options.stylesPath || this.config.get("stylesPath") || path.join(appPath, "styles");

    var buildTool = this.options.buildTool || this.config.get("buildTool") || "none";

    var language = this.options.language || this.config.get("language") || "javascript";

    var useGrunt = this.options.useGrunt;
    var useBrowserify = this.options.useBrowserify;
    var useWebpack = this.options.useWebpack;
    var useES6Modules = this.options.useES6Modules;

    var indent = "";
    if (language === "es6") {
      if (this.options.loadingType === "AMD" && !(useWebpack || useBrowserify)) {
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
      if (this.options.loadingType === "AMD" && !(useWebpack || useBrowserify)) {
        // js+AMD: 8 spaces
        indent = "        ";
      } else {
        // js: 6 spaces
        indent = "      ";
      }
    }

    var modules = this.config.get("modules");

    var vars = {
      name: this.options.name,
      appPath: utils.unixPath(appPath),
      scriptsPath: utils.unixPath(scriptsPath),
      moduleList: useBrowserify ? modules.map(function(module) { return '../lib/'+module}) : modules,
      useTypeInfo: this.options.useTypeInfo,
      useVsCode: this.options.useVsCode,
      useGrunt: useGrunt,
      useBrowserify: useBrowserify,
      useWebpack: useWebpack,
      useES6Modules: useES6Modules,
      content: this.options.content && this.options.content.replace(/(\n|\r\n)/gm, "$1" + indent),
      loadingType: this.options.loadingType,
      postClassContent: this.options.postClassContent && this.options.postClassContent.replace(/(\n|\r\n)/gm, "$1    "),
      description: this.options.description,
      licenseContent: this.config.get("licenseContent"),
      appScript: this.options.appScript
    };

    if (language === "javascript" || language === "es6") {

      var template;
      if(useES6Modules) {
        template = "applicationES6Modules.ejs"
      } else if(vars.loadingType === "AMD" && !(vars.useWebpack || vars.useBrowserify)) {
        template = "applicationAmd.ejs";
      } else if(vars.loadingType === "systemjs") {
        template = "applicationSystemJS.ejs";
      } else {
        template = "application.ejs";
      }

      this.fs.copyTpl(
        this.templatePath(path.join(language, template)),
        this.destinationPath(path.join(scriptsPath, vars.appScript)),
        vars
      );
    } else {

      var template = useES6Modules ? "applicationES6Modules.ejs" : "application.ejs";

      this.fs.copyTpl(
        this.templatePath(path.join(language, template)),
        this.destinationPath(path.join(scriptsPath, vars.appScript)),
        vars
      );
    }
  }
});
