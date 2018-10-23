"use strict";
var yeoman = require("yeoman-generator");
var chalk = require("chalk");
var toFileUrl = require('file-url');
var yosay = require("yosay");
var path = require("path");
var fs = require("fs");
var extend = require("deep-extend");
var toSlugCase = require('to-slug-case')
var yfilesModules = require("./yfiles-modules.json");
var yfilesES6Modules = require("./yfiles-es6-modules.json");
var yfilesScriptModules = require("./yfiles-script-modules.json");
var utils = require("../utils");
var validatePrompts = require("./validatePrompts");

var promptOptions = require("./promptOptions")

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
      {name: "Visual Studio Code integration", checked: false},
      {name: "WebStorm/PHP-Storm/Intellij IDEA Ultimate Project files", checked: false}
    ];

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
      validate: validatePrompts.isValidYfilesLicense
    },{
      type: "list",
      name: "moduleType",
      message: "Which kind of yFiles modules do you want to use?",
      choices: [promptOptions.moduleType.UMD, promptOptions.moduleType.ES6_MODULES],
      default: promptOptions.moduleType.ES6_MODULES,
      store: true
    },{
      type: "list",
      name: "buildTool",
      message: "Which build tool do you want to use?",
      choices: function (props) {
        var choices = [promptOptions.buildTool.NONE, promptOptions.buildTool.GRUNT, promptOptions.buildTool.WEBPACK];
        if(props.moduleType !== promptOptions.moduleType.ES6_MODULES) {
          choices.push(promptOptions.buildTool.BROWSERIFY);
        }
        return choices;
      },
      default: "none",
      when: function (props) {
        return props.moduleType !== promptOptions.moduleType.ES6_MODULES
      },
      store: true
    }, {
      type: "list",
      name: "loadingType",
      message: "Module loading method",
      choices: [promptOptions.loadingType.AMD, promptOptions.loadingType.SCRIPT_TAGS, promptOptions.loadingType.SYSTEMJS],
      default: "AMD",
      store: true,
      when: function (props) {
        return props.moduleType !== promptOptions.moduleType.ES6_MODULES && (props.buildTool === promptOptions.buildTool.NONE || props.buildTool === promptOptions.buildTool.GRUNT);
      }
    }, {
      type: "checkbox",
      name: "modules",
      message: "Which modules do you want to use?",
      store: true,
      choices: function(props) {
        return (props.moduleType === promptOptions.moduleType.ES6_MODULES ? Object.keys(yfilesES6Modules) : utils.flattenTree(yfilesModules, "yfiles/complete")).map(function (mod) {
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
        } else if (props.loadingType !== promptOptions.loadingType.SYSTEMJS){
          return [promptOptions.language.ES5, promptOptions.language.ES6, promptOptions.language.ES6Babel, promptOptions.language.TypeScript]
        } else {
          // systemjs
          return [promptOptions.language.ES5, promptOptions.language.ES6Babel, promptOptions.language.TypeScript]
        }
      },
      default: promptOptions.language.ES5,
      store: true
    }, {
      type: "list",
      name: "webpackVersion",
      message: "Which webpack version would you like to use?",
      choices: [{
        name: "3.x",
        value: 3
      }, {
        name: "4.x",
        value: 4
      }],
      when: function (props) {
        return props.buildTool === promptOptions.buildTool.WEBPACK || props.moduleType === promptOptions.moduleType.ES6_MODULES
      },
      default: 0, // choice index
      store: true
    }, {
      type: "checkbox",
      name: "advancedOptions",
      message: "What else do you want?",
      choices: function (props) {
       if (props.buildTool && props.buildTool.indexOf("none") >= 0) {
          return advancedOptions.concat([
            {name: "Use yfiles-typeinfo.js", checked: true}
          ]);
        }
        return advancedOptions;
      },
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

      this.props.useBrowserify = answers.buildTool === "Browserify";
      this.props.useES6Modules = answers.moduleType === promptOptions.moduleType.ES6_MODULES
      this.props.useWebpack = answers.buildTool === "webpack" || this.props.useES6Modules;
      this.props.webpack4 = answers.webpackVersion === 4;
      this.props.useGrunt = answers.buildTool === "Grunt" || this.props.useBrowserify || this.props.useWebpack;
      this.props.useYarn = answers.buildChain === promptOptions.buildChain.YARN;

      this.props.useBundlingTool = this.props.useBrowserify || this.props.useWebpack;

      this.props.useTypeScript = answers.language === "TypeScript";
      this.props.useEs6 = answers.language === promptOptions.language.ES6;
      this.props.useEs6Babel = answers.language === promptOptions.language.ES6Babel;
      this.props.useTypeInfo = answers.advancedOptions.indexOf("Use yfiles-typeinfo.js") >= 0 && !this.props.useTypeScript && !this.props.useGrunt;
      this.props.useIdeaProject = answers.advancedOptions.indexOf("WebStorm/PHP-Storm/Intellij IDEA Ultimate Project files") >= 0;

      this.props.useBabel = (this.props.useEs6Babel && !this.props.useTypeScript)
      this.props.useVsCode = answers.advancedOptions.indexOf("Visual Studio Code integration") >= 0;


      this.props.licensePath = answers.licensePath;
      this.props.language = this.props.useTypeScript ? "typescript"
        : (this.props.useEs6 || this.props.useEs6Babel) ? "es6"
          : "javascript";

      this.props.loadingType = this.props.useTypeScript && answers.loadingType === promptOptions.loadingType.SCRIPT_TAGS ? promptOptions.loadingType.AMD : answers.loadingType;
      this.props.modules = utils.joinArrays(this.minimumModules, answers.modules);

      if (answers.loadingType === promptOptions.loadingType.SCRIPT_TAGS) {
        this.props.modules = utils.insertChildren(this.props.modules, yfilesScriptModules).filter(function(module) {
          return module.indexOf("/impl/") >= 0;
        }).reverse();
      } else {
        this.props.modules = utils.removeChildren(this.props.modules, this.props.useES6Modules ? yfilesES6Modules : yfilesModules);
      }

      var languageToExtension = {
        'javascript': 'js',
        'typescript': 'ts',
        'es6': 'es6'
      };
      this.props.appScript = this.props.useEs6 ? 'app.js' : ('app.' + languageToExtension[this.props.language]);

      this.props.licenseContent = JSON.stringify(utils.parseLicense(this.props.licensePath), null, 2);

      this.props.typingsFilename = this.getTypingsFilename()
      this.props.useLoader = this.props.loadingType === promptOptions.loadingType.SYSTEMJS || this.props.loadingType === promptOptions.loadingType.AMD;
      this.props.usePackageJSON = this.props.useBrowserify || this.props.useBundlingTool || this.props.useGrunt || this.props.useBabel
        || this.props.useTypeScript || this.props.useLoader;

      if (this.props.useWebpack || this.props.useBrowserify || this.props.useGrunt) {
        this.props.runScript = "dev";
      } else if (this.props.useTypeScript && !this.props.usePackageJSON){
        // you should run tsc..
        this.props.runPostInstall = "tsc";
      } else if (this.props.useBabel){
        this.props.runScript = "babel";
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
        this.props.language === "javascript" && !(this.props.loadingType === promptOptions.loadingType.SYSTEMJS) && !(this.props.useBrowserify || this.props.useWebpack) ?
          "new app." + this.props.applicationName + "();" :
          this.props.language === "typescript" && (this.props.useBrowserify || this.props.useWebpack || this.props.loadingType === promptOptions.loadingType.SYSTEMJS) ?
            "new " + this.props.applicationName + "();" :
            this.props.useBrowserify || this.props.useWebpack || this.props.loadingType === promptOptions.loadingType.SYSTEMJS?
              "new (yfiles.module(\"app\"))." + this.props.applicationName + "();" : ""
    });

    this.composeWith(require.resolve("../class/"), options);

  },

  getTypingsFilename: function() {
    var useVSCode = this.props.useVsCode || (this.props.useTypeScript && !this.props.useIdeaProject);
    if(this.props.useES6Modules) {
      return useVSCode ? 'yfiles-api-es6-modules-vscode.d.ts' : 'yfiles-api-es6-modules-webstorm.d.ts'
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
      useES6: this.props.useEs6 || this.props.useEs6Babel,
      useTypeInfo: this.props.useTypeInfo,
      useGrunt: this.props.useGrunt,
      useYarn: this.props.useYarn,
      useBrowserify: this.props.useBrowserify,
      useIdeaProject: this.props.useIdeaProject,
      useVsCode: this.props.useVsCode,
      useWebpack: this.props.useWebpack,
      useTypeScript: this.props.useTypeScript,
      useBabel: this.props.useBabel,
      useLoader: this.props.useLoader,
      language: this.props.language,
      usePackageJSON: this.props.usePackageJSON,
      appScript: this.props.appScript,
      useES6Modules: this.props.useES6Modules,
      moduleType: this.props.moduleType,
      typingsFilename: this.props.typingsFilename
    };

    this.fs.copyTpl(
      this.templatePath("index.ejs"),
      this.destinationPath(path.join(appPath, "index.html")),
      templateVars
    );


    if(this.props.useES6Modules) {
      this.fs.copy(
        path.join(this.props.yfilesPath, "lib/es6-modules/"),
        this.destinationPath(libPath)
      );
    } else {
      this.fs.copy(
        path.join(this.props.yfilesPath, "lib/umd/"),
        this.destinationPath(libPath)
      );
    }

    this.fs.copy(
      path.join(this.props.yfilesPath, "lib/yfiles.css"),
      this.destinationPath(path.join(stylesPath, "yfiles.css"))
    );

    if (this.props.useTypeScript) {
      this.fs.copy(
        path.join(this.props.yfilesPath, "ide-support/" + this.props.typingsFilename),
        this.destinationPath(path.join(appPath, "typings/" + this.props.typingsFilename))
      );
    }

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
    // Write package.json for require.js or system.js
    //
    if (this.props.useLoader) {
      pkg.dependencies = pkg.dependencies || (pkg.dependencies = {});
      if (this.props.loadingType === promptOptions.loadingType.AMD) {
        pkg.dependencies["requirejs"] = "^2.3.5";
      } else {
        pkg.dependencies["systemjs"] = "^0.21.0";
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
        scripts.production = this.props.useYarn ? "yarn run dev && yarn run obfuscate" : "npm run dev && npm run obfuscate";
      }
      if (this.props.useBrowserify) {
        devDependencies.browserify = "^16.1.0";
        devDependencies.watchify = "^3.10.0";
        // Apparently, browserify and watchify can't create their output directories on their own, so we need mkdirp as well.
        devDependencies.mkdirp =  "^0.5.1";

        if(this.props.useBabel) {
          //
          // Browserify and es6
          //
          devDependencies.babelify = "^7.3.0";
          scripts.dev = "mkdirp app/dist && browserify app/scripts/app.es6 -o app/dist/bundle.js  -t [ babelify --extensions .es6 --presets [ env ] ]";
          scripts.watch = "mkdirp app/dist && watchify app/scripts/app.es6 -o app/dist/bundle.js  -t [ babelify --extensions .es6 --presets [ env ] ] --poll=100 -v";
          if (this.props.useYarn) {
            scripts.production = "yarn run babel && yarn run obfuscate && mkdirp app/dist && browserify build/obf/scripts/app.js -o app/dist/bundle.js";
          } else {
            scripts.production = "npm run babel && npm run obfuscate && mkdirp app/dist && browserify build/obf/scripts/app.js -o app/dist/bundle.js";
          }
          scripts.babel = "babel -x \".es6\" --presets=env app/scripts --out-dir app/scripts";
        } else {
          scripts.dev = "mkdirp app/dist && browserify app/scripts/app.js -o app/dist/bundle.js";
          scripts.watch = "mkdirp app/dist && watchify app/scripts/app.js -o app/dist/bundle.js --poll=100 -v";
          if (this.props.useYarn) {
            scripts.production = "yarn run obfuscate && mkdirp app/dist && browserify build/obf/scripts/app.js -o app/dist/bundle.js";
          } else {
            scripts.production = "npm run obfuscate && mkdirp app/dist && browserify build/obf/scripts/app.js -o app/dist/bundle.js";
          }
        }
      }

      extend(pkg, {
        scripts: scripts,
        devDependencies: devDependencies
      });

      this.fs.copyTpl(
        this.templatePath("Gruntfile.ejs"),
        this.destinationPath("Gruntfile.js"),
        templateVars
      );

    }

    if(this.props.useWebpack) {
      var webpackProps = null;
      if(this.props.webpack4) {
        webpackProps = {
          configTemplate: "webpack4.config.ejs",
          productionParam: "--mode production",
          devParam: "--mode development",
          deps: {
            "webpack": "^4.22.0",
            "webpack-cli": "^3.1.2",
            "webpack-dev-server": "^3.1.10"
          },
          tsDeps: {
            "ts-loader": "^4.0.1",
            "typescript": "^2.7.2"
          }
        }
      } else {
        webpackProps = {
          configTemplate: "webpack.config.ejs",
          productionParam: "--env=prod",
          devParam: "--env=dev",
          deps: {
            "webpack": "^3.11.0",
            "webpack-dev-server": "^2.11.2"
          },
          tsDeps: {
            "ts-loader": "^3.5.0",
            "typescript": "^2.7.2"
          }
        }
      }
    }

    //
    // Webpack without Typescript
    //
    if (this.props.useWebpack && !this.props.useTypeScript) {

      var devDeps = {
        "uglifyjs-webpack-plugin": "^1.2.3",
      };

      extend(devDeps, webpackProps.deps)

      var pkgScripts = {
        "production": this.props.useYarn ? "yarn run obfuscate && webpack " + webpackProps.productionParam : "npm run obfuscate && webpack "+ webpackProps.productionParam,
        "dev": "webpack " + webpackProps.devParam,
        "start": "webpack-dev-server " + webpackProps.devParam + " --open"
      };

      this.props.runScript = 'dev';

      if(this.props.useBabel) {
        devDeps["babel-loader"] = "^7.0.0";
        pkgScripts.production = (this.props.useYarn ? "yarn run babel && " : "npm run babel && " ) +pkgScripts.production;
      }

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

      var devDependencies = extend(extend({}, webpackProps.deps),webpackProps.tsDeps)

      extend(pkg, {
        scripts: {
          "production": this.props.useYarn ? "tsc --outFile app/scripts/app.js && yarn run obfuscate && webpack " + webpackProps.productionParam: "tsc --outFile app/scripts/app.js && npm run obfuscate && webpack " + webpackProps.productionParam,
          "dev": "webpack " + webpackProps.devParam,
          "start": "webpack-dev-server " + webpackProps.devParam + " --open"
        },
        devDependencies: devDependencies
      });

      this.props.runScript = 'dev';

    }

    if (this.props.useBabel) {

      var scripts =  {
        "babel": "babel -x \".es6\" --presets=env app/scripts --out-dir app/scripts"
      };

      if(!this.props.useBundlingTool) {
        scripts.dev = "babel -x \".es6\" --watch --presets=env app/scripts --out-dir app/scripts";
        this.props.runScript = 'babel';
      }

      extend(pkg, {
        scripts: scripts,
        devDependencies: {
          "babel-cli": "^6.24.1",
          "babel-preset-env": "^1.6.1"
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
