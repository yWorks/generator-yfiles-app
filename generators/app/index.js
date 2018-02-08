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
      default: "ES6 Modules",
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
      when: function(props) {
        return props.moduleType !== promptOptions.moduleType.ES6_MODULES
      },
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
    }];

    return this.prompt(prompts).then(function(answers) {
      this.props = answers;

      this.props.useBrowserify = answers.buildTool === "Browserify";
      this.props.useES6Modules = answers.moduleType === promptOptions.moduleType.ES6_MODULES
      this.props.useWebpack = answers.buildTool === "webpack" || this.props.useES6Modules;
      this.props.useGrunt = answers.buildTool === "Grunt" || this.props.useBrowserify || this.props.useWebpack;

      this.props.useBundlingTool = this.props.useBrowserify || this.props.useWebpack;

      this.props.useTypeScript = answers.language === "TypeScript";
      this.props.useEs6 = answers.language === promptOptions.language.ES6 || this.props.useES6Modules;
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
      content: this.fs.read(this.templatePath(path.join(this.props.language), this.props.useES6Modules ? "applicationContentES6Modules.ejs" : "applicationContent.ejs")),
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
      yFilesUrl: toFileUrl(this.props.yfilesPath),
      modules: this.props.modules,
      useES6: this.props.useEs6 || this.props.useEs6Babel,
      useTypeInfo: this.props.useTypeInfo,
      useGrunt: this.props.useGrunt,
      useBrowserify: this.props.useBrowserify,
      useIdeaProject: this.props.useIdeaProject,
      useVsCode: this.props.useVsCode,
      useWebpack: this.props.useWebpack,
      useTypeScript: this.props.useTypeScript,
      useBabel: this.props.useBabel,
      useBower: !(this.props.useWebpack || this.props.useBrowserify || this.props.loadingType === promptOptions.loadingType.SCRIPT_TAGS),
      language: this.props.language,
      usePackageJSON: this.props.useBrowserify || this.props.useBundlingTool || this.props.useGrunt || this.props.useBabel
      || this.props.useTypeScript,
      appScript: this.props.appScript,
      useES6Modules: this.props.useES6Modules,
      moduleType: this.props.moduleType
    };

    this.fs.copyTpl(
      this.templatePath("index.ejs"),
      this.destinationPath(path.join(appPath, "index.html")),
      vars
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
        vars
      );
      this.fs.copyTpl(
        this.templatePath("idea/jsLibraryMappings.xml"),
        this.destinationPath(path.join(".idea", "jsLibraryMappings.xml")),
        vars
      );
      this.fs.copyTpl(
        this.templatePath("idea/project.iml"),
        this.destinationPath(path.join(".idea", vars.applicationName + ".iml")),
        vars
      );
      this.fs.copyTpl(
        this.templatePath("idea/modules.xml"),
        this.destinationPath(path.join(".idea", "modules.xml")),
        vars
      );
      this.fs.copyTpl(
        this.templatePath("idea/misc.xml"),
        this.destinationPath(path.join(".idea", "misc.xml")),
        vars
      );
      if(this.props.useES6Modules) {
        this.fs.copyTpl(
          this.templatePath("idea/webResources.xml"),
          this.destinationPath(path.join(".idea", "webResources.xml")),
          vars
        );
      }
    }

    vars.libPath = utils.unixPath(libPath);

    var pkg = this.fs.readJSON(this.destinationPath("package.json"), {});

    //
    // Write bower.json for require.js or system.js
    //
    if (vars.useBower) {
      var bower = this.fs.readJSON(this.destinationPath("bower.json"), {});
      extend(bower, {
        "name": toSlugCase(this.props.applicationName),
        "description": pkg.description || "",
        "main": (this.props.useGrunt ? distPath : appPath)+"/app.js",
        "version": pkg.version || "0.0.0",
        "dependencies": {
        },
        "private": true
      });

      if (this.props.loadingType === promptOptions.loadingType.AMD) {
        bower.dependencies["requirejs"] = "^2.3.2";
      } else {
        bower.dependencies["system.js"] = "systemjs/systemjs";
      }

      this.fs.writeJSON(this.destinationPath("bower.json"), bower)
    }

    if (this.props.useTypeScript && !this.props.useWebpack) {
      this.fs.copy(
        path.join(this.props.yfilesPath, "ide-support/yfiles-api-umd-vscode.d.ts"),
        this.destinationPath(path.join(appPath, "typings/yfiles-api-umd-vscode.d.ts"))
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
          "typescript": "^2.6.2"
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
        path.join(this.props.yfilesPath, "ide-support/yfiles-api-umd-vscode.d.ts"),
        this.destinationPath(path.join(appPath, "typings/yfiles-api-umd-vscode.d.ts"))
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

    if (vars.usePackageJSON) {
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
        path.join(this.props.yfilesPath, "ide-support/yfiles-api-umd-vscode.d.ts"),
        this.destinationPath(path.join(appPath, "typings/yfiles-api-umd-vscode.d.ts"))
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

    if (!(this.props.useWebpack || this.props.useBrowserify || this.props.loadingType === promptOptions.loadingType.SCRIPT_TAGS) || this.props.useTypeScript || this.props.useGrunt) {
      this.installDependencies({
        bower: !(this.props.useWebpack || this.props.useBrowserify || this.props.loadingType === promptOptions.loadingType.SCRIPT_TAGS),
        npm: this.props.useGrunt || this.props.useTypeScript || this.props.useBabel,
        callback: function () {
          postInstall()
        }.bind(this)
      });
    }
  }
});
