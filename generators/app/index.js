"use strict";
var yeoman = require("yeoman-generator");
var chalk = require("chalk");
var toFileUrl = require('file-url');
var yosay = require("yosay");
var path = require("path");
var fs = require("fs");
var extend = require("deep-extend");
var yfilesModules = require("./yfiles-modules.json");
var yfilesES6Modules = require("./yfiles-es6-modules.json");
var yfilesScriptModules = require("./yfiles-script-modules.json");
var utils = require("../utils");
var validatePrompts = require("./validatePrompts");

var promptOptions = require("./promptOptions");

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

    var prompts = [{
      type: "input",
      name: "applicationName",
      message: "Application name",
      default: path.basename(process.cwd().replace('-','_')),
      filter: function (name) {
        name = utils.camelCase(name);
        return name.charAt(0).toUpperCase() + name.slice(1);
      },
      validate: utils.isValidName
    }, {
      type: "input",
      name: "yfilesPath",
      message: "Path of yFiles for HTML package",
      default: "./",
      store: true,
      validate: validatePrompts.isValidYfilesPackage
    }, {
      type: "input",
      name: "licensePath",
      message: "Path of license file (e.g. 'path/to/license.json')",
      default: function(props) {
        var licensePath = path.join(props.yfilesPath, "lib/license.json");
        if (fs.existsSync(licensePath)) {
          return licensePath + "";
        }
        licensePath = path.join(props.yfilesPath, "license.json");
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
      validate: validatePrompts.isValidYfilesLicense
    },{
      type: "list",
      name: "moduleType",
      message: "Which kind of yFiles modules do you want to use?",
      choices: [promptOptions.moduleType.UMD, promptOptions.moduleType.ES6_MODULES, promptOptions.moduleType.NPM],
      default: promptOptions.moduleType.NPM,
      store: true
    },{
      type: "list",
      name: "buildTool",
      message: "Which build tool do you want to use?",
      choices: [promptOptions.buildTool.NONE, promptOptions.buildTool.WEBPACK],
      when: function (props) {
        return props.moduleType === promptOptions.moduleType.UMD
      },
      default: promptOptions.buildTool.NONE,
      store: true
    }, {
      type: "list",
      name: "loadingType",
      message: "Module loading method",
      choices: [promptOptions.loadingType.AMD, promptOptions.loadingType.SCRIPT_TAGS],
      default: "AMD",
      store: true,
      when: function (props) {
        return props.moduleType === promptOptions.moduleType.UMD && props.buildTool === promptOptions.buildTool.NONE;
      }
    }, {
      type: "checkbox",
      name: "modules",
      message: "Which modules do you want to use?",
      store: true,
      when: function (props) {
        return props.moduleType === promptOptions.moduleType.ES6_MODULES // UMD always loads complete, local npm does not split modules
      },
      choices: function(props) {
        return (props.moduleType === promptOptions.moduleType.ES6_MODULES ? Object.keys(yfilesES6Modules) : utils.flattenTree(yfilesModules, "complete")).map(function (mod) {
          return {
            name: mod,
            checked: this.minimumModules.indexOf(mod) >= 0
          };
        }.bind(this))
      }.bind(this)
    }, {
      type: "list",
      name: "language",
      message: "Which language variant do you want to use?",
      choices: function (props) {
        if (props.moduleType === promptOptions.moduleType.ES6_MODULES) {
          return [promptOptions.language.ES6, promptOptions.language.TypeScript]
        } else if (props.buildTool === promptOptions.buildTool.NONE){
          return [promptOptions.language.ES5, promptOptions.language.ES6];
        } else {
          return [promptOptions.language.ES6, promptOptions.language.TypeScript]
        }
      },
      default: promptOptions.language.ES6,
      store: true
    }, {
      type: "checkbox",
      name: "advancedOptions",
      message: "What else do you want?",
      choices: [
        {name: "Use yfiles-typeinfo.js", checked: true},
        {name: "Visual Studio Code integration", checked: false},
        {name: "WebStorm/PHP-Storm/Intellij IDEA Ultimate Project files", checked: false}
      ],
      store: true
    }, {
      type: "list",
      name: "buildChain",
      message: "Which package manager would you like to use?",
      choices: [promptOptions.buildChain.YARN, promptOptions.buildChain.NPM],
      store: true,
      default: promptOptions.buildChain.NPM
    }];

    return this.prompt(prompts).then(function(answers) {
      this.props = answers;

      this.props.useES6Modules = answers.moduleType === promptOptions.moduleType.ES6_MODULES;
      this.props.useLocalNpm = answers.moduleType === promptOptions.moduleType.NPM;
      this.props.useWebpack = answers.buildTool === "webpack" || this.props.useES6Modules || this.props.useLocalNpm;
      this.props.useYarn = answers.buildChain === promptOptions.buildChain.YARN;

      this.props.useBundlingTool = this.props.useWebpack;

      this.props.useTypeScript = answers.language === "TypeScript";
      this.props.useEs6 = answers.language === promptOptions.language.ES6;
      this.props.useEs5 = answers.language === promptOptions.language.ES5;
      this.props.useTypeInfo = answers.advancedOptions.indexOf("Use yfiles-typeinfo.js") >= 0;
      this.props.useIdeaProject = answers.advancedOptions.indexOf("WebStorm/PHP-Storm/Intellij IDEA Ultimate Project files") >= 0;

      this.props.useVsCode = answers.advancedOptions.indexOf("Visual Studio Code integration") >= 0;


      this.props.licensePath = answers.licensePath;
      this.props.language = this.props.useTypeScript ? "typescript"
        : this.props.useEs6 ? "es6"
          : "javascript";

      this.props.loadingType = this.props.useTypeScript && answers.loadingType === promptOptions.loadingType.SCRIPT_TAGS ? promptOptions.loadingType.AMD : answers.loadingType;
      this.props.modules = utils.joinArrays(this.minimumModules, answers.moduleType === promptOptions.moduleType.ES6_MODULES ? answers.modules : ["complete"]);

      if (answers.loadingType === promptOptions.loadingType.SCRIPT_TAGS) {
        const modules = utils.insertChildren(this.props.modules, yfilesScriptModules);
        this.props.modules = modules.filter(function(module) {
          return module.indexOf("impl/") >= 0;
        }).reverse();
      } else {
        this.props.modules = utils.removeChildren(this.props.modules, this.props.useES6Modules ? yfilesES6Modules : yfilesModules);
      }

      if (answers.loadingType === promptOptions.loadingType.AMD) {
        // add a 'yfiles' prefix since we define the requirejs base path with 'yfiles'
        this.props.modules = this.props.modules.map(module => 'yfiles/' + module)
      }

      var languageToExtension = {
        'javascript': 'js',
        'typescript': 'ts',
        'es6': 'es6'
      };
      this.props.appScript = this.props.useEs6 ? 'app.js' : ('app.' + languageToExtension[this.props.language]);

      this.props.licenseContent = JSON.stringify(utils.parseLicense(this.props.licensePath), null, 2);

      this.props.typingsFilename = this.getTypingsFilename();
      this.props.useLoader = this.props.loadingType === promptOptions.loadingType.AMD;
      this.props.usePackageJSON = this.props.useBundlingTool || this.props.useTypeScript || this.props.useLoader;

      if (this.props.useWebpack) {
        this.props.runScript = "dev";
      } else if (this.props.useTypeScript && !this.props.usePackageJSON){
        // you should run tsc..
        this.props.runPostInstall = "tsc";
      }
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

    var options = {};
    extend(options,this.props);
    extend(options,{
      name: this.props.applicationName,
      description: "A simple yFiles application that creates a GraphComponent and enables basic input gestures.",
      appPath: this.config.get("appPath"),
      scriptsPath: this.config.get("scriptsPath"),
      libPath: this.config.get("libPath"),
      stylesPath: this.config.get("stylesPath"),
      postClassContent: this.props.language === "es6" ?
        "new " + this.props.applicationName + "();" :
        this.props.language === "javascript" && !this.props.useWebpack ?
          "new app." + this.props.applicationName + "();" :
          this.props.language === "typescript" && this.props.useWebpack ?
            "new " + this.props.applicationName + "();" : this.props.useWebpack ?
              "new (yfiles.module(\"app\"))." + this.props.applicationName + "();" : ""
    });

    this.composeWith(require.resolve("../class/"), options);

  },

  getTypingsFilename: function() {
    var useVSCode = this.props.useVsCode || (this.props.useTypeScript && !this.props.useIdeaProject);
    if(this.props.useES6Modules) {
      return useVSCode ? 'yfiles-api-es-modules-vscode.d.ts' : 'yfiles-api-es-modules-webstorm.d.ts'
    } else {
      return useVSCode ? 'yfiles-api-umd-vscode.d.ts' : 'yfiles-api-umd-webstorm.d.ts'
    }
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

    var templateVars = {
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
      yFilesUrl: toFileUrl(this.props.yfilesPath),
      modules: this.props.modules,
      useES6: this.props.useEs6,
      useTypeInfo: this.props.useTypeInfo,
      useYarn: this.props.useYarn,
      useIdeaProject: this.props.useIdeaProject,
      useVsCode: this.props.useVsCode,
      useWebpack: this.props.useWebpack,
      useTypeScript: this.props.useTypeScript,
      useLoader: this.props.useLoader,
      language: this.props.language,
      usePackageJSON: this.props.usePackageJSON,
      appScript: this.props.appScript,
      useES6Modules: this.props.useES6Modules,
      useLocalNpm: this.props.useLocalNpm,
      moduleType: this.props.moduleType,
      typingsFilename: this.props.typingsFilename
    };

    this.fs.copyTpl(
      this.templatePath("index.ejs"),
      this.destinationPath(path.join(appPath, "index.html")),
      templateVars
    );


    if (!this.props.useLocalNpm) {
      if (this.props.useES6Modules) {
        this.fs.copy(path.join(this.props.yfilesPath, "lib/es-modules/**/*js"),
          this.destinationPath(path.join(libPath, "yfiles")));
        this.fs.copy(path.join(this.props.yfilesPath, "lib/umd/es2015-shim.js"),
          this.destinationPath(path.join(libPath, "es2015-shim.js")));
      } else {
        this.fs.copy(path.join(this.props.yfilesPath, "lib/umd/"), this.destinationPath(libPath));
      }
      if (this.props.useTypeScript) {
        this.fs.copy(path.join(this.props.yfilesPath, "ide-support/" + this.props.typingsFilename),
          this.destinationPath(path.join(appPath, "typings/" + this.props.typingsFilename)));
      }
    } else {
      var createNpmTypingsPath = path.join(path.relative("./", this.props.yfilesPath), "tools/create-npm-typings/");
      if (this.props.useVsCode) {
        // we need to build the vscode typings for local npm modules
        this.log(chalk.green("\nBuilding yFiles typings for VSCode ...\n"));
        if (this.props.useYarn) {
          this.spawnCommandSync( "yarn",["--cwd", createNpmTypingsPath, "install"]);
          this.spawnCommandSync( "yarn",["--cwd", createNpmTypingsPath, "npm-module-vscode"]);
        } else {
          this.spawnCommandSync( "npm" ,["--prefix", createNpmTypingsPath, "install", createNpmTypingsPath]);
          this.spawnCommandSync( "npm" ,["--prefix", createNpmTypingsPath, "run", "npm-module-vscode"]);
        }
      } else {
        // build the webstorm npm typings (there may be the vscode typings currently)
        this.log(chalk.green("\nBuilding yFiles typings for WebStorm ...\n"));
        if (this.props.useYarn) {
          this.spawnCommandSync( "yarn",["--cwd", createNpmTypingsPath, "install"]);
          this.spawnCommandSync( "yarn",["--cwd", createNpmTypingsPath, "npm-module-webstorm"]);
        } else {
          this.spawnCommandSync( "npm" ,["--prefix", createNpmTypingsPath, "install", createNpmTypingsPath]);
          this.spawnCommandSync( "npm" ,["--prefix", createNpmTypingsPath, "run", "npm-module-webstorm"]);
        }
      }

      this.fs.copy(path.join(this.props.yfilesPath, "lib/umd/es2015-shim.js"),
        this.destinationPath(path.join(path.join(appPath, "shim"), "es2015-shim.js")));
    }

    this.fs.copy(path.join(this.props.yfilesPath, "lib/yfiles.css"),
      this.destinationPath(path.join(stylesPath, "yfiles.css")));

    if (this.props.useTypeInfo) {
      this.fs.copy(
        path.join(this.props.yfilesPath, "ide-support/yfiles-typeinfo.js"),
        this.destinationPath(path.join(scriptsPath, "yfiles-typeinfo.js"))
      );
    }

    if (this.props.useIdeaProject) {
      this.fs.copyTpl(
        this.templatePath("idea/yFiles_for_HTML.xml"),
        this.destinationPath(path.join(".idea", "libraries", "yFiles_for_HTML.xml")),
        templateVars
      );
      this.fs.copyTpl(
        this.templatePath("idea/jsLibraryMappings.xml"),
        this.destinationPath(path.join(".idea", "jsLibraryMappings.xml")),
        templateVars
      );
      this.fs.copyTpl(
        this.templatePath("idea/project.iml"),
        this.destinationPath(path.join(".idea", this.props.applicationName + ".iml")),
        templateVars
      );
      this.fs.copyTpl(
        this.templatePath("idea/modules.xml"),
        this.destinationPath(path.join(".idea", "modules.xml")),
        templateVars
      );
      this.fs.copyTpl(
        this.templatePath("idea/misc.xml"),
        this.destinationPath(path.join(".idea", "misc.xml")),
        templateVars
      );
      if(this.props.useES6Modules) {
        this.fs.copyTpl(
          this.templatePath("idea/webResources.xml"),
          this.destinationPath(path.join(".idea", "webResources.xml")),
          templateVars
        );
      }
    }

    templateVars.libPath = utils.unixPath(libPath);

    var pkg = this.fs.readJSON(this.destinationPath("package.json"), { description: "My first yFiles for HTML WebApp.", "license":"unlicensed", "private": true});

    pkg.name = pkg.name || this.props.applicationName.toLowerCase();
    pkg.version = pkg.version || "1.0.0";
    pkg.private = pkg.private || true;

    //
    // Write package.json for require.js
    //
    if (this.props.useLoader) {
      pkg.dependencies = pkg.dependencies || (pkg.dependencies = {});
      if (this.props.loadingType === promptOptions.loadingType.AMD) {
        pkg.dependencies["requirejs"] = "^2.3.5";
      }
    }

    if (this.props.useTypeScript && !this.props.useWebpack) {
      this.fs.copyTpl(
        this.templatePath(path.join(this.props.language), "tsconfig.ejs"),
        this.destinationPath("tsconfig.json"),
        templateVars
      );

      extend(pkg, {
        scripts: {
          dev: "tsc",
          watch: "tsc -w"
        },
        devDependencies: {
          "typescript": "^2.7.2"
        }
      });

      this.props.runScript = "dev";
    }

    if(this.props.useWebpack) {
      var webpackProps = {
        configTemplate: "webpack4.config.ejs",
        productionParam: "--mode production",
        devParam: "--mode development",
        deps: {
          "@yworks/optimizer": "^0.1.12",
          "webpack": "^4.22.0",
          "webpack-cli": "^3.1.2",
          "webpack-dev-server": "^3.1.10"
        },
        tsDeps: {
          "ts-loader": "^4.0.1",
          "typescript": "^2.7.2"
        }
      }
    }

    //
    // Webpack without Typescript
    //
    if (this.props.useWebpack && !this.props.useTypeScript) {

      var devDeps = {};
      extend(devDeps, webpackProps.deps);

      var pkgScripts = {
        "production": "webpack " + webpackProps.productionParam,
        "dev": "webpack " + webpackProps.devParam,
        "start": "webpack-dev-server " + webpackProps.devParam + " --open"
      };

      this.props.runScript = 'dev';

      devDeps["babel-loader"] = "^8.0.5";
      devDeps["@babel/core"] = "^7.4.0";
      devDeps["@babel/preset-env"] = "^7.4.2";

      extend(pkg, {
        scripts: pkgScripts,
        devDependencies: devDeps
      });

      this.fs.copyTpl(
        this.templatePath(webpackProps.configTemplate),
        this.destinationPath("webpack.config.js"),
        templateVars
      );

    }

    //
    // Webpack + Typescript
    //
    else if(this.props.useWebpack && this.props.useTypeScript) {

      this.fs.copyTpl(
        this.templatePath(path.join(this.props.language), "tsconfig.ejs"),
        this.destinationPath("tsconfig.json"),
        templateVars
      );

      this.fs.copyTpl(
        this.templatePath(webpackProps.configTemplate),
        this.destinationPath("webpack.config.js"),
        templateVars
      );

      var devDependencies = extend(extend({}, webpackProps.deps),webpackProps.tsDeps);

      extend(pkg, {
        scripts: {
          "production": "webpack " + webpackProps.productionParam,
          "dev": "webpack " + webpackProps.devParam,
          "start": "webpack-dev-server " + webpackProps.devParam + " --open"
        },
        devDependencies: devDependencies
      });

      this.props.runScript = 'dev';

    }

    if (this.props.useLocalNpm) {
      extend(pkg, {
        dependencies: {
          yfiles: path.join(this.props.yfilesPath, "lib/es-modules/")
        }
      });
    }

    if (this.props.usePackageJSON) {
      this.fs.writeJSON(this.destinationPath("package.json"), pkg);
    }

    //
    // Visual Studio Code
    // Handle vs code last, so package.json is final already and we can
    // just add all npm scripts to tasks.json
    //
    if (this.props.useVsCode) {
      if(!this.props.useTypeScript) {
        var jsconfig = this.fs.readJSON(this.destinationPath("jsconfig.json"), {});
        jsconfig.exclude = [
          "node_modules",
          appPath + "/lib",
          "dist",
          "build"
        ];
        this.fs.writeJSON(this.destinationPath("jsconfig.json"), jsconfig);
      }

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

    }

  },

  install: function () {
    var postInstall = function () {
      if (this.props.runScript){
        this.log(chalk.green("\nFinished your scaffold. Running '" + this.props.runScript + "' for you...\n"));
        this.spawnCommandSync( this.props.useYarn ? "yarn" : "npm" ,["run",this.props.runScript]);
      }
      if (this.props.runPostInstall) {
        this.log(chalk.green("\nAlmost done. Now running '" + this.props.runPostInstall + "' for you...\n"));
        this.spawnCommandSync(this.props.runPostInstall);
      }
    }.bind(this);

    if (this.props.usePackageJSON){
      this.installDependencies({
        bower: false,
        yarn: this.props.useYarn,
        npm: !this.props.useYarn,
        callback: function () {
          postInstall()
        }.bind(this)
      });
    }
  }
});
