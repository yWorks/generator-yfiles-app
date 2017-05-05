"use strict";
var yeoman = require("yeoman-generator");
var chalk = require("chalk");
var yosay = require("yosay");
var path = require("path");
var fs = require("fs");
var extend = require("deep-extend");
var toSlugCase = require('to-slug-case')
var yfilesModules = require("./yfiles-modules.json");
var yfilesScriptModules = require("./yfiles-script-modules.json");
var _ = require("lodash");
var utils = require("../utils");

module.exports = yeoman.extend({
  initializing: function () {
    this.minimumModules = [];
  },

  prompting: function () {
    // Have Yeoman greet the user.
    this.log(yosay(
      "Welcome to the " + chalk.cyan("yFiles") + "-application generator!"
    ));

    this.log(chalk.green("Take a look at the README for further information how to use this generator."));

    var advancedOptions = [
      {name: "Visual Studio Code integration", checked: false}
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
      default: function(props) {
        var licensePath = path.join(props.yfilesPath, "demos/resources/license.js");
        if (fs.existsSync(licensePath)) {
          return licensePath + "";
        }
        licensePath = path.join(props.yfilesPath, "license.js");
        if (fs.existsSync(licensePath)) {
          return licensePath + "";
        }
        licensePath = path.join(props.yfilesPath, "yWorks.yFilesHTML.DevelopmentLicense.js");
        if (fs.existsSync(licensePath)) {
          return licensePath + "";
        }
        return "";
      }.bind(this),
      store: true,
      validate: function (p) {
        if(!fs.existsSync(p)) {
          return "The license file was not found at the specified location."
        } else {
          var parsedLicense = this._parseLicense(p);
          if(!parsedLicense || !parsedLicense.key || !parsedLicense.product || !(parsedLicense.product === 'yFiles for HTML')) {
            return "The provided file does not appear to be a valid yFiles for HTML license file."
          } else {
            return true;
          }
        }
      }.bind(this)
    }, {
      type: "list",
      name: "buildTool",
      message: "Which build tool do you want to use?",
      choices: ["none", "Grunt", "Browserify", "webpack"],
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
      store: true,
      choices: utils.flattenTree(yfilesModules, "yfiles/complete").map(function (mod) {
        return {
          name: mod,
          checked: this.minimumModules.indexOf(mod) >= 0
        };
      }.bind(this))
    }, {
      type: "list",
      name: "language",
      message: "Do you want to use ECMAScript 6 or TypeScript?",
      choices: ["No", "ECMAScript 6 & babel", "TypeScript"],
      default: "No",
      store: true
    }, {
      type: "checkbox",
      name: "advancedOptions",
      message: "What else do you want?",
      choices: function (props) {
       if (props.buildTool.indexOf("none") >= 0) {
          return advancedOptions.concat([
            {name: "Use yfiles-typeinfo.js", checked: true}
          ]);
        }
        return advancedOptions;
      },
      store: true
    }];

    return this.prompt(prompts).then(function(answers) {
      this.props = answers;

      this.props.useBrowserify = answers.buildTool === "Browserify";
      this.props.useWebpack = answers.buildTool === "webpack";
      this.props.useGrunt = answers.buildTool === "Grunt" || this.props.useBrowserify || this.props.useWebpack;

      this.props.useBundlingTool = this.props.useBrowserify || this.props.useWebpack;

      this.props.useTypeScript = answers.language === "TypeScript";
      this.props.useEs6 = answers.language === "ECMAScript 6 & babel";
      this.props.useTypeInfo = answers.advancedOptions.indexOf("Use yfiles-typeinfo.js") >= 0 && !this.props.useTypeScript && !this.props.useGrunt;

      // For TypeScript AND Webpack, we need babel for the production (obfuscated) build (ts to es6 => babel to es5 => deployment tool => bundle)
      this.props.useBabel = (this.props.useEs6 && !this.props.useTypeScript) || (this.props.useTypeScript && this.props.useWebpack);
      this.props.useVsCode = answers.advancedOptions.indexOf("Visual Studio Code integration") >= 0;

      this.props.licensePath = answers.licensePath;
      this.props.language = this.props.useTypeScript ? "typescript"
        : this.props.useEs6 ? "es6"
          : "javascript";

      this.props.loadingType = this.props.useTypeScript && answers.loadingType === "script-tags" ? "AMD" : answers.loadingType;
      this.props.modules = utils.joinArrays(this.minimumModules, answers.modules);

      if (answers.loadingType === "script-tags") {
        this.props.modules = utils.insertChildren(this.props.modules, yfilesScriptModules).filter(function(module) {
          return module.indexOf("/impl/") >= 0;
        }).reverse();
      } else {
        this.props.modules = utils.removeChildren(this.props.modules, yfilesModules);
      }

      var languageToExtension = {
        'javascript': 'js',
        'typescript': 'ts',
        'es6': 'es6'
      };
      this.props.appScript = 'app.' + languageToExtension[this.props.language];

      this.props.licenseContent = JSON.stringify(this._parseLicense(this.props.licensePath), null, 2);
    }.bind(this));
  },

  _parseLicense: function(path) {
    var global = {
      yfiles: {},
    };
    try {
      // wrap the file with a function
      var getModules = new Function("global", this.fs.read(path));
      // and pass yfiles and lang to it
      getModules.call(global, global);
      return global.yfiles.license;
    } catch (e) {
      this.log("Could not parse license: "+e.message||e);
      return null;
    }
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

    var options = {};
    extend(options,this.props);
    extend(options,{
      name: this.props.applicationName,
      description: "A simple yFiles application that creates a GraphComponent and enables basic input gestures.",
      content: this.fs.read(this.templatePath(path.join(this.props.language), "applicationContent.ejs")),
      appPath: this.config.get("appPath"),
      scriptsPath: this.config.get("scriptsPath"),
      libPath: this.config.get("libPath"),
      stylesPath: this.config.get("stylesPath"),
      postClassContent: this.props.language === "es6" ?
        "new " + this.props.applicationName + "();" :
        this.props.language === "javascript" && !(this.props.loadingType === "systemjs") && !(this.props.useBrowserify || this.props.useWebpack) ?
          "new " + this.props.module + "." + this.props.applicationName + "();" :
          this.props.language === "typescript" && (this.props.useBrowserify || this.props.useWebpack || this.props.loadingType === "systemjs") ?
            "new " + this.props.applicationName + "();" :
            this.props.useBrowserify || this.props.useWebpack || this.props.loadingType === "systemjs"?
              "new (yfiles.module(\"" + this.props.module + "\"))." + this.props.applicationName + "();" : ""
    });

    this.composeWith(require.resolve("../class/"), options);

  },

  writing: function () {

    var appPath = "app";
    var scriptsPath = path.join(appPath, "scripts");
    var libPath = path.join(appPath, "lib");
    var stylesPath = path.join(appPath, "styles");
    var distPath = "dist/";
    var babelDest = "build/es5";

    // If we don't bundle at all, the deployment tool should output directly to dist/.
    // Else, the deployment tool should output the intermediate result to build/obf, where it will be picked
    // up by the bundling tool.
    var obfDest = this.props.useBundlingTool ? 'build/obf/' : distPath;

    var obfSource = utils.unixPath(scriptsPath);

    var vars = {
      obfSource: obfSource,
      obfDest: obfDest,
      babelDest: babelDest,
      useBundlingTool: this.props.useBundlingTool,
      title: this.props.applicationName,
      loadingType: this.props.loadingType,
      applicationName: this.props.applicationName,
      libPath: "lib/",
      appPath: utils.unixPath(appPath),
      scriptsPath: utils.unixPath(scriptsPath),
      distPath: distPath,
      module: this.props.module,
      modules: this.props.modules,
      useTypeInfo: this.props.useTypeInfo,
      useGrunt: this.props.useGrunt,
      useBrowserify: this.props.useBrowserify,
      useVsCode: this.props.useVsCode,
      useWebpack: this.props.useWebpack,
      useTypeScript: this.props.useTypeScript,
      useBabel: this.props.useBabel,
      language: this.props.language,
      appScript: this.props.appScript
    };

    this.fs.copyTpl(
      this.templatePath("index.ejs"),
      this.destinationPath(path.join(appPath, "index.html")),
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

    if (this.props.useTypeInfo) {
      this.fs.copy(
        path.join(this.props.yfilesPath, "ide-support/yfiles-typeinfo.js"),
        this.destinationPath(path.join(scriptsPath, "yfiles-typeinfo.js"))
      );
    }

    vars.libPath = utils.unixPath(libPath);

    var pkg = this.fs.readJSON(this.destinationPath("package.json"), {});

    //
    // Write bower.json for require.js or system.js
    //
    if (!(this.props.useWebpack || this.props.useBrowserify || this.props.loadingType === "script-tags")) {
      var bower = this.fs.readJSON(this.destinationPath("bower.json"), {});
      extend(bower, {
        "name": toSlugCase(this.props.applicationName),
        "description": pkg.description || "",
        "main": (this.props.useGrunt ? distPath : appPath)+"app.js",
        "version": pkg.version || "0.0.0",
        "dependencies": {
        },
        "private": true
      });

      if (this.props.loadingType === "AMD") {
        bower.dependencies["requirejs"] = "^2.3.2";
      } else {
        bower.dependencies["system.js"] = "systemjs/systemjs";
      }

      this.fs.writeJSON(this.destinationPath("bower.json"), bower)
    }

    if (this.props.useTypeScript && !this.props.useWebpack) {
      this.fs.copy(
        path.join(this.props.yfilesPath, "ide-support/yfiles-api.d.ts"),
        this.destinationPath(path.join(appPath, "typings/yfiles-api.d.ts"))
      );
      this.fs.copyTpl(
        this.templatePath(path.join(this.props.language), "tsconfig.ejs"),
        this.destinationPath("tsconfig.json"),
        vars
      );

      extend(pkg, {
        scripts: {
          build: "tsc",
          watch: "tsc -w"
        },
        devDependencies: {
          "typescript": "^2.1.4",
          "typings": "^2.1.0"
        }
      });

    }

    if (this.props.useGrunt) {
      var devDependencies = {
        "grunt": "^1.0.1",
        "grunt-contrib-clean": "^1.0.0",
        "grunt-yfiles-deployment": path.join(this.props.yfilesPath, "deployment/grunt-yfiles-deployment"),
        "load-grunt-tasks": "^3.5.2"
      };

      var scripts = {};
      if(this.props.useBundlingTool||this.props.useTypeScript) {
        scripts.obfuscate = "grunt";
      } else {
        // if we don't bundle, running the deployment tool is already the final production step
        scripts.production = "grunt";
      }

      if (this.props.useTypeScript) {
        scripts.production = "npm run build && npm run obfuscate";
      }
      if (this.props.useBrowserify) {
        devDependencies.browserify = "^14.3.0";
        devDependencies.watchify = "^3.9.0";
        // Apparently, browserify and watchify can't create their output directories on their own, so we need mkdirp as well.
        devDependencies.mkdirp =  "^0.5.1";

        if(this.props.useBabel) {
          //
          // Browserify and es6
          //
          devDependencies.babelify = "^7.3.0";
          scripts.dev = "mkdirp app/dist && browserify app/scripts/app.es6 -o app/dist/bundle.js  -t [ babelify --extensions .es6 --presets [ es2015 ] ]";
          scripts.watch = "mkdirp app/dist && watchify app/scripts/app.es6 -o app/dist/bundle.js  -t [ babelify --extensions .es6 --presets [ es2015 ] ] --poll=100 -v";
          scripts.production = "npm run babel && npm run obfuscate && mkdirp app/dist && browserify build/obf/scripts/app.js -o app/dist/bundle.js";
          scripts.babel = "babel -x \".es6\" --presets=es2015 app/scripts --out-dir app/scripts";
        } else {
          scripts.dev = "mkdirp app/dist && browserify app/scripts/app.js -o app/dist/bundle.js";
          scripts.watch = "mkdirp app/dist && watchify app/scripts/app.js -o app/dist/bundle.js --poll=100 -v";
          scripts.production = "npm run obfuscate && mkdirp app/dist && browserify build/obf/scripts/app.js -o app/dist/bundle.js";
        }
      }

      extend(pkg, {
        scripts: scripts,
        devDependencies: devDependencies
      });

      this.fs.copyTpl(
        this.templatePath("Gruntfile.ejs"),
        this.destinationPath("Gruntfile.js"),
        vars
      );

    }

    //
    // Webpack without Typescript
    //
    if (this.props.useWebpack && !this.props.useTypeScript) {

      var devDeps = {
        "webpack": "^2.4.1",
        "webpack-dev-server": "^2.4.2"
      };

      var pkgScripts = {
        "production": "npm run obfuscate && webpack --env=prod",
        "dev": "webpack --env=dev",
        "start": "webpack-dev-server --env=dev --open"
      };

      if(this.props.useBabel) {
        devDeps["babel-loader"] = "^7.0.0";
        pkgScripts.production = "npm run babel && "+pkgScripts.production;
      }

      extend(pkg, {
        scripts: pkgScripts,
        devDependencies: devDeps
      });

      this.fs.copyTpl(
        this.templatePath("webpack.config.ejs"),
        this.destinationPath("webpack.config.js"),
        vars
      );

    }

    //
    // Webpack + Typescript
    //
    else if(this.props.useWebpack && this.props.useTypeScript) {

      this.fs.copy(
        path.join(this.props.yfilesPath, "ide-support/yfiles-api.d.ts"),
        this.destinationPath(path.join(appPath, "typings/yfiles-api.d.ts"))
      );

      this.fs.copyTpl(
        this.templatePath(path.join(this.props.language), "tsconfig.ejs"),
        this.destinationPath("tsconfig.json"),
        vars
      );

      this.fs.copyTpl(
        this.templatePath("webpack.config.ejs"),
        this.destinationPath("webpack.config.js"),
        vars
      );

      extend(pkg, {
        scripts: {
          "production": "tsc --outFile app/scripts/app.es6 && npm run babel && npm run obfuscate && webpack --env=prod",
          "dev": "webpack --env=dev",
          "start": "webpack-dev-server --env=dev --open"
        },
        devDependencies: {
          "ts-loader": "^2.0.3",
          "typescript": "^2.1.4",
          "typings": "^2.1.0",
          "webpack": "^2.4.1",
          "webpack-dev-server": "^2.4.2"
        }
      });

    }

    if (this.props.useBabel) {

      var scripts =  {
        "babel": "babel -x \".es6\" --presets=es2015 app/scripts --out-dir app/scripts"
      };

      if(!this.props.useBundlingTool) {
        scripts.dev = "babel -x \".es6\" --watch --presets=es2015 app/scripts --out-dir app/scripts";
      }

      extend(pkg, {
        scripts: scripts,
        devDependencies: {
          "babel-cli": "^6.24.1",
          "babel-preset-es2015": "^6.24.1"
        }
      });

    }

    if (this.props.useBrowserify || this.props.useBundlingTool || this.props.useGrunt || this.props.useBabel
      || this.props.useTypeScript) {
      this.fs.writeJSON(this.destinationPath("package.json"), pkg);
    }

    //
    // Visual Studio Code
    // Handle vs code last, so package.json is final already and we can
    // just add all npm scripts to tasks.json
    //
    if (this.props.useVsCode) {
      var jsconfig = this.fs.readJSON(this.destinationPath("jsconfig.json"), {});
      jsconfig.exclude = [
        "node_modules",
        appPath + "/lib",
        "dist",
        "build"
      ];
      this.fs.writeJSON(this.destinationPath("jsconfig.json"), jsconfig);

      var npmScripts = pkg.scripts;
      if(npmScripts && Object.keys(npmScripts).length>0) {

        var tasksPath = path.join(".vscode", "tasks.json");
        var tasksJson = this.fs.readJSON(tasksPath, {});

        var tasks = [];

        Object.keys(npmScripts).forEach(function(scriptName) {
          var taskDef = {
            "taskName": scriptName,
            "args": ["run-script",scriptName]
          };
          if(scriptName==="build"||scriptName==="dev") {
            taskDef.isBuildCommand = true;
          }
          tasks.push(taskDef)
        });

        extend(tasksJson, {
          "version": "0.1.0",
          "command": "npm",
          "isShellCommand": true,
          "showOutput": "always",
          "suppressTaskName": true,
          "tasks": tasks
        });

        this.fs.writeJSON(this.destinationPath(tasksPath), tasksJson);

      }

      this.fs.copy(
        path.join(this.props.yfilesPath, "ide-support/yfiles-api.d.ts"),
        this.destinationPath(path.join(appPath, "typings/yfiles-api.d.ts"))
      );

    }

  },

  install: function () {
    var postInstall = function () {
      if (this.props.useWebpack || this.props.useBrowserify) {
        this.log(chalk.green("\nFinished your scaffold. Running 'npm run-script dev' for you...\n"));
        this.spawnCommandSync("npm",["run-script","dev"]);
      } else if (this.props.useTypeScript) {
        this.log(chalk.green("\nFinished your scaffold. Running 'tsc' for you...\n"));
        this.spawnCommandSync("tsc");
      } else if(this.props.useBabel) {
        this.log(chalk.green("\nFinished your scaffold. Running 'npm run-script babel' for you...\n"));
        this.spawnCommandSync("npm",["run-script","babel"]);
      }
    }.bind(this);

    if (!(this.props.useWebpack || this.props.useBrowserify || this.props.loadingType === "script-tags") || this.props.useTypeScript || this.props.useGrunt) {
      this.installDependencies({
        bower: !(this.props.useWebpack || this.props.useBrowserify || this.props.loadingType === "script-tags"),
        npm: this.props.useGrunt || this.props.useTypeScript || this.props.useBabel,
        callback: function () {
          postInstall()
        }.bind(this)
      });
    }
  }
});
