"use strict";
var yeoman = require("yeoman-generator");
var chalk = require("chalk");
var yosay = require("yosay");
var path = require("path");
var fs = require("fs");
var extend = require("deep-extend");
var yfilesModules = require("./yfiles-modules.json");
var yfilesScriptModules = require("./yfiles-script-modules.json");
var _ = require("lodash");
var utils = require("../utils");

module.exports = yeoman.generators.Base.extend({
  initializing: function () {
    this.minimumModules = [];
  },

  prompting: function () {
    var done = this.async();

    // Have Yeoman greet the user.
    this.log(yosay(
      "Welcome to the " + chalk.cyan("yFiles") + "-application generator!"
    ));

    this.log(chalk.green("Take a look at the README for further information how to use this generator."));

    var advancedOptions = [
      {name: "npm & git", checked: false}
    ];

    var prompts = [{
      type: "input",
      name: "applicationName",
      message: "Application name",
      default: path.basename(process.cwd()),
      filter: function (name) {
        name = utils.camelCase(name);
        return name.charAt(0).toUpperCase() + name.slice(1);
      },
      validate: utils.isValidName
    }, {
      type: "input",
      name: "module",
      message: "Module name",
      default: "application",
      store: true,
      filter: utils.camelCase,
      validate: utils.isValidName
    }, {
      type: "input",
      name: "yfilesPath",
      message: "Path of yFiles for HTML package",
      default: "./",
      store: true,
      validate: function (p) {
        return !fs.existsSync(p) ? "This path does not exist" :
          !fs.existsSync(path.join(p, "lib", "yfiles")) ? "Not a valid yfiles package" : true;
      }
    }, {
      type: "input",
      name: "licensePath",
      message: "Path of license file (e.g. 'path/to/license.js')",
      store: true,
      when: function (props) {
        return !(this.fs.exists(this.licensePath = path.join(props.yfilesPath, "yWorks.yFilesHTML.DevelopmentLicense.js"))
        || this.fs.exists(this.licensePath = path.join(props.yfilesPath, "license.js")));
      }.bind(this)
    }, {
      type: "list",
      name: "buildTool",
      message: "Which build tool do you want to use?",
      choices: ["none", "Grunt", "Grunt + Browserify", "Grunt + Webpack"],
      default: "none",
      store: true
    }, {
      type: "list",
      name: "loadingType",
      message: "Module loading method",
      choices: ["AMD", "script-tags", "systemjs"],
      default: "AMD",
      store: true,
      when: function (props) {
        return props.buildTool === "none" || props.buildTool === "Grunt";
      }
    }, {
      type: "checkbox",
      name: "modules",
      message: "Which modules do you want to use?",
      choices: utils.flattenTree(yfilesModules, "yfiles/complete").map(function (mod) {
        return {
          name: mod,
          checked: this.minimumModules.indexOf(mod) >= 0
        };
      }.bind(this))
    }, {
      type: "checkbox",
      name: "advancedOptions",
      message: "What else do you want?",
      choices: function (props) {
        if (props.buildTool.indexOf("Grunt + Browserify") >= 0) {
          return advancedOptions.concat([
            {name: "ECMAScript 6 & babel", checked: false}
          ]);
        } else if (props.buildTool.indexOf("Grunt + Webpack") >= 0) {
          return advancedOptions.concat([
            {name: "ECMAScript 6 & babel", checked: false}
          ]);
        } else if (props.buildTool.indexOf("Grunt") >= 0) {
          return advancedOptions.concat([
            {name: "ECMAScript 6 & babel", checked: false},
            {name: "TypeScript", checked: false}
          ]);
        } else if (props.buildTool.indexOf("none") >= 0) {
          return advancedOptions.concat([
            {name: "Use yfiles-typeinfo.js", checked: true},
            {name: "ECMAScript 6", checked: false},
            {name: "TypeScript", checked: false}
          ]);
        }
        return advancedOptions;
      },
      store: true
    }];

    this.prompt(prompts, function (props) {
      this.props = props;

      this.props.useBrowserify = props.buildTool === "Grunt + Browserify";
      this.props.useWebpack = props.buildTool === "Grunt + Webpack";
      this.props.useGruntBundling = props.buildTool === "Grunt" || this.props.useBrowserify || this.props.useWebpack;

      this.props.useTypeScript = props.advancedOptions.indexOf("TypeScript") >= 0;
      this.props.useTypeInfo = props.advancedOptions.indexOf("Use yfiles-typeinfo.js") >= 0 && !this.props.useTypeScript && !this.props.useGruntBundling;
      this.props.useNpmAndGit = props.advancedOptions.indexOf("npm & git") >= 0;
      this.props.useBabel = props.advancedOptions.indexOf("ECMAScript 6 & babel") >= 0 && !this.props.useTypeScript;


      this.fs.exists(this.licensePath) || (this.licensePath = props.licensePath);
      this.props.language = this.props.useTypeScript ? "typescript"
        : (props.advancedOptions.indexOf("ECMAScript 6") >= 0 || props.advancedOptions.indexOf("ECMAScript 6 & babel") >= 0) ? "es6"
          : "javascript";

      this.props.loadingType = this.props.useTypeScript && props.loadingType === "script-tags" ? "AMD" : props.loadingType;
      this.props.modules = utils.joinArrays(this.minimumModules, props.modules);

      if (props.loadingType === "script-tags") {
        this.props.modules = utils.insertChildren(this.props.modules, yfilesScriptModules).filter(function(module) {
          return module.indexOf("/impl/") >= 0;
        }).reverse();
      } else {
        this.props.modules = utils.removeChildren(this.props.modules, yfilesModules);
      }

      this.props.licenseContent = /yfiles\.license\s*=\s*\{.*?}/g.exec(
        this.fs.read(this.licensePath)
          .replace(/[\n\r]/g, "")
          .replace(/\s*?"/g, '"')
      )[0];

      done();
    }.bind(this));

  },

  configuring: function () {
    // create .yo-rc.json file
    this.config.set("appPath", "app");
    this.config.set("scriptsPath", "app/scripts");
    this.config.set("libPath", "app/lib");
    this.config.set("stylesPath", "app/styles");
    this.config.set("buildTool", this.props.buildTool);
    this.config.set("language", this.props.language);
    this.config.set("modules", this.props.modules);
    this.config.set("licenseContent", this.props.licenseContent);
    this.config.save();
  },

  default: function () {
    this.composeWith("yfiles-app:class", {
      options: {
        name: this.props.applicationName,
        module: this.props.module,
        description: "A simple yFiles application that creates a GraphControl and enables basic input gestures.",
        buildTool: this.props.buildTool,
        useTypeInfo: this.props.useTypeInfo,
        dependencies: this.props.language === "es6" && !(this.props.useBrowserify || this.props.useWebpack) ?
          (this.props.loadingType === "script-tags" ? [] : ["yfiles"])
          : this.props.useBrowserify ?
          (this.props.useTypeInfo && this.props.language !== "es6" ? ["yfiles-typeinfo.js"] : []).concat(this.props.modules)
          : this.props.useWebpack ?
          ["license", "yfiles/es2015-shim"].concat(this.props.useTypeInfo  && this.props.language !== "es6" ? ["yfiles-typeinfo"] : [], this.props.modules)
          : ["yfiles/lang", "yfiles/view-component"],
        content: this.fs.read(this.templatePath(path.join(this.props.language), "applicationContent.ejs")),
        appPath: this.config.get("appPath"),
        scriptsPath: this.config.get("scriptsPath"),
        libPath: this.config.get("libPath"),
        stylesPath: this.config.get("stylesPath"),
        loadingType: this.props.loadingType,
        postClassContent: this.props.language === "es6" ?
          "new " + this.props.applicationName + "();" :
          this.props.language === "javascript" && !(this.props.loadingType === "systemjs") && !(this.props.useBrowserify || this.props.useWebpack) ?
          "new " + this.props.module + "." + this.props.applicationName + "();" :
          this.props.language === "typescript" && (this.props.useBrowserify || this.props.useWebpack) ?
          "new " + this.props.applicationName + "();" :
          this.props.useBrowserify || this.props.useWebpack ?
          "new (yfiles.module(\"" + this.props.module + "\"))." + this.props.applicationName + "();" : ""
      }
    });

    if (this.props.useNpmAndGit) {
      var readmeTpl = _.template(this.fs.read(this.templatePath("README.md")));
      this.composeWith("node:app", {
        options: {
          babel: false,
          gulp: false,
          travis: false,
          boilerplate: false,
          name: this.props.applicationName,
          projectRoot: this.props.useGruntBundling ? "dist" : "app",
          skipInstall: this.options.skipInstall,
          readme: readmeTpl(this.props)
        }
      }, {
        local: require("generator-node").app
      });
    }
  },

  writing: function () {

    var appPath = "app";
    var scriptsPath = path.join(appPath, "scripts");
    var libPath = path.join(appPath, "lib");
    var stylesPath = path.join(appPath, "styles");
    var distPath = "dist/";

    var vars = {
      title: this.props.applicationName,
      loadingType: this.props.loadingType,
      applicationName: this.props.applicationName,
      libPath: "lib/",
      appPath: utils.unixPath(appPath),
      scriptsPath: utils.unixPath(scriptsPath),
      packageLibPath: this.props.useBrowserify ? "build/lib/" : distPath + "lib/",
      distPath: distPath,
      module: this.props.module,
      modules: this.props.modules,
      useTypeInfo: this.props.useTypeInfo,
      useGruntBundling: this.props.useGruntBundling,
      useBrowserify: this.props.useBrowserify,
      useWebpack: this.props.useWebpack,
      useBabel: this.props.useBabel,
      language: this.props.language,
    };

    this.fs.copyTpl(
      this.templatePath("index.ejs"),
      this.destinationPath(path.join(appPath, this.props.applicationName + ".html")),
      vars
    );

    this.fs.copy(
      path.join(this.props.yfilesPath, "lib"),
      this.destinationPath(libPath)
    );

    // move yfiles.css into styles folder
    this.fs.move(
      this.destinationPath(path.join(libPath, "yfiles.css")),
      this.destinationPath(path.join(stylesPath, "yfiles.css"))
    );

    if (!(this.props.useWebpack)) {
      this.fs.copy(
        this.licensePath,
        this.destinationPath(path.join(scriptsPath, "license.js"))
      );
    }

    if (this.props.useTypeInfo) {
      this.fs.copy(
        path.join(this.props.yfilesPath, "ide-support/yfiles-typeinfo.js"),
        this.destinationPath(path.join(scriptsPath, "yfiles-typeinfo.js"))
      );
    }


    vars.libPath = utils.unixPath(libPath);

    var pkg = this.fs.readJSON(this.destinationPath("package.json"), {});

    if (!(this.props.useWebpack || this.props.useBrowserify || this.props.loadingType === "script-tags")) {
      var bower = this.fs.readJSON(this.destinationPath("bower.json"), {});
      extend(bower, {
        "name": this.props.applicationName,
        "description": pkg.description || "",
        "main": (this.props.useGruntBundling ? distPath : appPath) + this.props.applicationName,
        "version": pkg.version || "0.0.0",
        "dependencies": {
        }
      });

      if (this.props.loadingType === "AMD") {
        bower.dependencies["requirejs"] = "^2.1.22";
      } else {
        bower.dependencies["system.js"] = "systemjs/systemjs";
      }

      this.fs.writeJSON(this.destinationPath("bower.json"), bower)
    }

    if (this.props.useTypeScript) {
      this.fs.copy(
        path.join(this.props.yfilesPath, "ide-support/yfiles-api.d.ts"),
        this.destinationPath(path.join(scriptsPath, "yfiles-api.d.ts"))
      );
      this.fs.copyTpl(
        this.templatePath(this.templatePath(path.join(this.props.language), "tsconfig.ejs")),
        this.destinationPath("tsconfig.json"),
        vars
      );

      extend(pkg, {
        devDependencies: {
          "typescript": "^2.0.3",
          "typings": "^1.4.0"
        }
      });

      if (!(this.props.useGruntBundling || this.props.useWebpack)) {
        this.fs.writeJSON(this.destinationPath("package.json"), pkg);
      }
    }

    if (!(this.props.useGruntBundling || this.props.useWebpack))
      return;

    if (this.props.useGruntBundling) {
      var devDependencies = {
        "grunt": "^0.4.5",
        "grunt-contrib-clean": "^0.6.0",
        "grunt-contrib-copy": "^0.8.0",
        "grunt-yfiles-deployment": path.join(this.props.yfilesPath, "deployment/grunt-yfiles-deployment"),
        "load-grunt-tasks": "^3.2.0"
      };
      this.props.useWebpack || (devDependencies["grunt-browserify"] = "^3.8.0");

      extend(pkg, {
        scripts: {
          build: this.props.useTypeScript ? "tsc && grunt" : "grunt"
        },
        devDependencies: devDependencies
      });

      this.fs.copyTpl(
        this.templatePath("Gruntfile.ejs"),
        this.destinationPath("Gruntfile.js"),
        vars
      );

    }

    if (this.props.useWebpack) {
      extend(pkg, {
        scripts: {
          "build-dev": "grunt build-dev"
        },
        devDependencies: {
          "deep-extend": "^0.4.1",
          "file-loader": "^0.8.5",
          "style-loader": "^0.13.0",
          "css-loader": "^0.23.1",
          "html-webpack-plugin": "^1.7.0",
          "webpack": "^1.8.11",
          "webpack-dev-server": "^1.8.2",
          "grunt-webpack": "^1.0.11"
        }
      });

      this.fs.copyTpl(
        this.templatePath("webpack.config.ejs"),
        this.destinationPath("webpack.config.js"),
        vars
      );

    } else {
      extend(pkg, {
        scripts: {
          "dev-server": "grunt dev-server"
        },
        devDependencies: {
          "express": "^4.13.4",
          "grunt-contrib-watch": "^0.6.1",
          "grunt-express-server": "^0.5.1",
          "open": "^0.0.5"
        }
      });

      if (this.props.useBabel) {
        pkg.devDependencies["grunt-babel"] = "^6.0.0";
      }

      this.fs.copyTpl(
        this.templatePath("server.ejs"),
        this.destinationPath("server.js"),
        vars
      )
    }

    if (this.props.useBabel) {
      extend(pkg, {
        devDependencies: {
          "grunt-babel": "^6.0.0",
          "babel-core": "^6.4.0",
          "babel-loader": "^6.2.1",
          "babel-preset-es2015": "^6.3.13",
          "babel-plugin-transform-es2015-arrow-functions": "^6.8.0"
        }
      });

      if (!(this.props.useWebpack || this.props.useBrowserify)) {
        pkg.devDependencies["babel-plugin-transform-es2015-modules-amd"] = "^6.6.5";
      }
    }

    this.fs.writeJSON(this.destinationPath("package.json"), pkg);
  },

  install: function () {
    var postInstall = function () {
      if (this.props.useGruntBundling) {
        this.log(chalk.green("\nFinished your scaffold. Running 'grunt' for you...\n"));
        if (this.props.useTypeScript) {
          this.spawnCommand("tsc").on('exit', function(err) {
            if (err) {
              this.log.error('tsc failed. Error: ' + err);
            } else {
              // run grunt after tsc
              this.spawnCommand("grunt");
            }
          }.bind(this));
        } else {
          this.spawnCommand("grunt");
        }
      } else if (this.props.useTypeScript) {
        this.log(chalk.green("\nFinished your scaffold. Running 'tsc' for you...\n"));
        this.spawnCommand("tsc");
      }
    }.bind(this);

    this.installDependencies({
      bower: !(this.props.useWebpack || this.props.useBrowserify || this.props.loadingType === "script-tags"),
      callback: function () {
        postInstall()
      }.bind(this)
    });

  }
});
