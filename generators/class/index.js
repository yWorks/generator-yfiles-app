"use strict";
var yeoman = require("yeoman-generator");
var yosay = require("yosay");
var utils = require("../utils");
var path = require("path");

module.exports = yeoman.generators.Base.extend({
  initializing: function () {
    this.option("name", {
      type: String,
      required: false,
      desc: "Class name"
    });

    this.option("module", {
      type: String,
      required: false,
      desc: "Module name"
    });

    this.option("buildTool", {
      type: String,
      required: false,
      desc: "Build tool used"
    });

    this.option("useTypeInfo", {
      type: Boolean,
      required: false,
      default: false,
      desc: "Require yfiles-typeinfo.js"
    });

    this.option("dependencies", {
      type: Array,
      required: false,
      defaults: ["yfiles/lang", "yfiles/core-lib"],
      desc: "The module this file depends on."
    });

    this.option("description", {
      type: String,
      required: false,
      desc: "JsDoc description"
    });

    this.option("content", {
      type: String,
      required: false,
      desc: "The code inside the class"
    });

    this.option("postClassContent", {
      type: String,
      required: false,
      desc: "Additional code outside the class"
    });

    this.option("appPath", {
      type: String,
      required: false,
      desc: "Path to 'app' directory"
    });

    this.option("scriptsPath", {
      type: String,
      required: false,
      desc: "Path to 'scripts' directory"
    });

    this.option("libPath", {
      type: String,
      required: false,
      desc: "Path to 'lib' directory"
    });

    this.option("stylesPath", {
      type: String,
      required: false,
      desc: "Path to 'styles' directory"
    });
  },

  prompting: function () {
    var done = this.async();

    var prompts = [{
      type: "input",
      name: "name",
      message: "Name",
      default: "MyClass",
      when: !this.options.name,
      filter: function (name) {
        name = utils.camelCase(name);
        return name.charAt(0).toUpperCase() + name.slice(1);
      }
    }, {
      type: "input",
      name: "module",
      message: "Module name",
      default: "application",
      store: true,
      when: !this.options.module,
      filter: utils.camelCase
    }];

    // TODO: extends, with, modules

    this.prompt(prompts, function (props) {
      this.props = props;
      done();
    }.bind(this));
  },

  writing: function () {
    var appPath = this.options.appPath || this.config.get("appPath") || "app";
    var scriptsPath = this.options.scriptsPath || this.config.get("scriptsPath") || path.join(appPath, "scripts");
    var libPath = this.options.libPath || this.config.get("libPath") || path.join(appPath, "lib");
    var stylesPath = this.options.stylesPath || this.config.get("stylesPath") || path.join(appPath, "styles");

    var buildTool = this.options.buildTool || this.config.get("buildTool") || "none";
    var vars = {
      name: this.options.name || this.props.name,
      appPath: utils.unixPath(appPath),
      scriptsPath: utils.unixPath(scriptsPath),
      module: this.options.module || this.props.module,
      modules: this.options.dependencies,
      useTypeInfo: this.options.useTypeInfo,
      useGruntBundling: buildTool.toLowerCase().indexOf("grunt") >= 0,
      useBrowserify: buildTool.toLowerCase().indexOf("browserify") >= 0,
      useWebpack: buildTool.toLowerCase().indexOf("webpack") >= 0,
      content: this.options.content && this.options.content.replace(/(\n|\r\n)/gm, "$1      "),
      postClassContent: this.options.postClassContent && this.options.postClassContent.replace(/(\n|\r\n)/gm, "$1    "),
      description: this.options.description
    };

    this.fs.copyTpl(
      this.templatePath("application.ejs"),
      this.destinationPath(path.join(scriptsPath, vars.name + ".js")),
      vars
    );
  }
});
