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

    var useGruntBundling = buildTool.toLowerCase().indexOf("grunt") >= 0;
    var useBrowserify = buildTool.toLowerCase().indexOf("browserify") >= 0;
    var useWebpack = buildTool.toLowerCase().indexOf("webpack") >= 0;

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
      module: this.options.module,
      moduleList: useBrowserify ? modules.map(function(module) { return '../lib/'+module}) : modules,
      useTypeInfo: this.options.useTypeInfo,
      useGruntBundling: useGruntBundling,
      useBrowserify: useBrowserify,
      useWebpack: useWebpack,
      content: this.options.content && this.options.content.replace(/(\n|\r\n)/gm, "$1" + indent),
      loadingType: this.options.loadingType,
      postClassContent: this.options.postClassContent && this.options.postClassContent.replace(/(\n|\r\n)/gm, "$1    "),
      description: this.options.description,
      licenseContent: this.config.get("licenseContent")
    };

    if (language === "javascript" || language === "es6") {
      this.fs.copyTpl(
        this.templatePath(path.join(language, (vars.loadingType === "AMD" && !(vars.useWebpack || vars.useBrowserify)) ? "applicationAmd.ejs" : "application.ejs")),
        this.destinationPath(path.join(scriptsPath, "app.js")),
        vars
      );
    } else {
      this.fs.copyTpl(
        this.templatePath(path.join(language, "application.ejs")),
        this.destinationPath(path.join(scriptsPath, "app" + (language === "typescript" ? ".ts" : ".js"))),
        vars
      );
    }
  }
});
