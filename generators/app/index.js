"use strict";
const chalk = require("chalk");
const toFileUrl = require("file-url");
const yosay = require("yosay");
const path = require("path");
const fs = require("fs");
const extend = require("deep-extend");
const yfilesModules = require("./yfiles-modules.json");
const yfilesES6Modules = require("./yfiles-es6-modules.json");
const yfilesScriptModules = require("./yfiles-script-modules.json");
const utils = require("../utils");
const validatePrompts = require("./validatePrompts");
const toSlugCase = require("to-slug-case");
const Git = require("nodegit");
const config = require("../config.js")

const Generator = require("yeoman-generator");

const promptOptions = require("./promptOptions");

module.exports = class extends Generator {
  initializing() {
    this.minimumModules = [];
    // Unless this is enabled, installation errors will just be swallowed.
    this.options["force-install"] = true

    this.on('error', function(e) {
      this.env.error(e)
      return false
    })
  }

  prompting() {
    // Have Yeoman greet the user.
    this.log(
      yosay(
        `Welcome to the ${chalk.cyan("yFiles")}-application generator for yFiles for HTML ${config.yFilesHTMLVersion}!

Generator Version: ${config.generatorVersion}`
      )
    );

    this.log(
      chalk.green(
        "Take a look at the README for further information how to use this generator."
      )
    );

    const prompts = [
      {
        type: "list",
        name: "projectType",
        message: "Which framework do you want to use?",
        choices: [
          promptOptions.projectType.PLAIN,
          promptOptions.projectType.ANGULAR,
          promptOptions.projectType.REACT,
          promptOptions.projectType.VUE
        ],
        default: promptOptions.projectType.PLAIN,
        store: true
      },
      {
        type: "input",
        name: "applicationName",
        message: "Application name",
        default: utils.toValidName(path.basename(process.cwd())),
        filter: function(name) {
          name = utils.camelCase(name);
          return name.charAt(0).toUpperCase() + name.slice(1);
        },
        validate: utils.isValidName,
        when: function(props) {
          return props.projectType === promptOptions.projectType.PLAIN;
        },
      },
      {
        type: "input",
        name: "yfilesPath",
        message: "Path of yFiles for HTML package",
        default: "./",
        store: true,
        validate: validatePrompts.isValidYfilesPackage
      },
      {
        type: "input",
        name: "licensePath",
        message: "Path of license file (e.g. 'path/to/license.json')",
        default: function(props) {
          let licensePath = path.join(props.yfilesPath, "lib/license.json");
          if (fs.existsSync(licensePath)) {
            return licensePath + "";
          }
          licensePath = path.join(props.yfilesPath, "license.json");
          if (fs.existsSync(licensePath)) {
            return licensePath + "";
          }
          licensePath = path.join(
            props.yfilesPath,
            "yWorks.yFilesHTML.DevelopmentLicense.js"
          );
          if (fs.existsSync(licensePath)) {
            return licensePath + "";
          }
          return "";
        }.bind(this),
        store: false,
        validate: validatePrompts.isValidYfilesLicense
      },
      {
        type: "list",
        name: "moduleType",
        message: "Which kind of yFiles modules do you want to use?",
        choices: [
          promptOptions.moduleType.NPM,
          promptOptions.moduleType.ES6_MODULES,
          promptOptions.moduleType.UMD
        ],
        default: promptOptions.moduleType.NPM,
        store: true,
        when: function(props) {
          return props.projectType === promptOptions.projectType.PLAIN;
        },
      },
      {
        type: "checkbox",
        name: "modules",
        message: "Which modules do you want to use?",
        store: true,
        when: function(props) {
          // es-modules and npm always use webpack and can benefit from tree-shaking.
          return props.moduleType === promptOptions.moduleType.UMD;
        },
        choices: function(props) {
          return utils.flattenTree(yfilesModules, "complete").map(
            function(mod) {
              return {
                name: mod,
                checked: this.minimumModules.indexOf(mod) >= 0
              };
            }.bind(this)
          );
        }.bind(this)
      },
      {
        type: "list",
        name: "buildTool",
        message: "Which build tool do you want to use?",
        choices: [
          promptOptions.buildTool.NONE,
          promptOptions.buildTool.WEBPACK
        ],
        when: function(props) {
          return props.moduleType === promptOptions.moduleType.UMD && props.projectType === promptOptions.projectType.PLAIN;
        },
        default: promptOptions.buildTool.NONE,
        store: true
      },
      {
        type: "list",
        name: "loadingType",
        message: "Module loading method",
        choices: [
          promptOptions.loadingType.AMD,
          promptOptions.loadingType.SCRIPT_TAGS
        ],
        default: "AMD",
        store: true,
        when: function(props) {
          return (
            props.moduleType === promptOptions.moduleType.UMD &&
            props.buildTool === promptOptions.buildTool.NONE && props.projectType === promptOptions.projectType.PLAIN
          );
        }
      },
      {
        type: "list",
        name: "language",
        message: "Which language variant do you want to use?",
        choices: function(props) {
          if (props.moduleType === promptOptions.moduleType.ES6_MODULES) {
            return [
              promptOptions.language.ES6,
              promptOptions.language.TypeScript
            ];
          } else if (props.buildTool === promptOptions.buildTool.NONE) {
            return [promptOptions.language.ES5, promptOptions.language.ES6];
          } else {
            return [
              promptOptions.language.ES6,
              promptOptions.language.TypeScript
            ];
          }
        },
        default: promptOptions.language.ES6,
        store: true,
        when: function(props) {
          return props.projectType === promptOptions.projectType.PLAIN;
        },
      },
      {
        type: "checkbox",
        name: "advancedOptions",
        message: "What else do you want?",
        choices: [
          { name: "Use development library", checked: true },
          { name: "Visual Studio Code integration", checked: false },
          {
            name: "WebStorm/PHP-Storm/Intellij IDEA Ultimate Project files",
            checked: false
          }
        ],
        store: true,
        when: function(props) {
          return props.projectType === promptOptions.projectType.PLAIN;
        },
      },
      {
        type: "list",
        name: "buildChain",
        message: "Which package manager would you like to use?",
        choices: [promptOptions.buildChain.YARN, promptOptions.buildChain.NPM],
        store: true,
        default: promptOptions.buildChain.NPM
      }
    ];

    return this.prompt(prompts).then(
      function(answers) {
        this.props = answers;

        if (this.props.projectType !== promptOptions.projectType.PLAIN) {
          return
        }

        this.props.useES6Modules =
          answers.moduleType === promptOptions.moduleType.ES6_MODULES;
        this.props.useLocalNpm =
          answers.moduleType === promptOptions.moduleType.NPM;
        this.props.useWebpack =
          answers.buildTool === "webpack" ||
          this.props.useES6Modules ||
          this.props.useLocalNpm;
        this.props.useYarn =
          answers.buildChain === promptOptions.buildChain.YARN;

        this.props.useBundlingTool = this.props.useWebpack;

        this.props.useTypeScript = answers.language === "TypeScript";
        this.props.useEs6 = answers.language === promptOptions.language.ES6;
        this.props.useEs5 = answers.language === promptOptions.language.ES5;
        this.props.useDevLib = answers.projectType !== promptOptions.projectType.PLAIN ||
          answers.advancedOptions.indexOf(promptOptions.advanced.DEVLIB) >= 0;
        this.props.useIdeaProject =
          answers.advancedOptions.indexOf(
            promptOptions.advanced.WEBSTORM
          ) >= 0;

        this.props.useVsCode =
          answers.advancedOptions.indexOf(promptOptions.advanced.VSCODE) >= 0;

        this.props.licensePath = answers.licensePath;
        this.props.language = this.props.useTypeScript
          ? "typescript"
          : this.props.useEs6
          ? "es6"
          : "javascript";

        this.props.loadingType =
          this.props.useTypeScript &&
          answers.loadingType === promptOptions.loadingType.SCRIPT_TAGS
            ? promptOptions.loadingType.AMD
            : answers.loadingType;
        if (answers.modules) {
          this.props.modules = utils.joinArrays(
            this.minimumModules,
            answers.modules
          );
        }

        if (answers.loadingType === promptOptions.loadingType.SCRIPT_TAGS) {
          const modules = utils.insertChildren(
            this.props.modules,
            yfilesScriptModules
          );
          this.props.modules = modules
            .filter(function(module) {
              return module.indexOf("impl/") >= 0;
            })
            .reverse();
        } else if(this.props.modules) {
          this.props.modules = utils.removeChildren(
            this.props.modules,
            this.props.useES6Modules ? yfilesES6Modules : yfilesModules
          );
        }

        if (answers.loadingType === promptOptions.loadingType.AMD) {
          // add a 'yfiles' prefix since we define the requirejs base path with 'yfiles'
          this.props.modules = this.props.modules.map(
            module => "yfiles/" + module
          );
        }

        const languageToExtension = {
          javascript: "js",
          typescript: "ts",
          es6: "es6"
        };
        this.props.appScript = this.props.useEs6
          ? "app.js"
          : "app." + languageToExtension[this.props.language];

        this.props.licenseContent = JSON.stringify(
          utils.parseLicense(this.props.licensePath),
          null,
          2
        );

        this.props.typingsFilename = this._getTypingsFilename();
        this.props.useLoader =
          this.props.loadingType === promptOptions.loadingType.AMD;
        this.props.usePackageJSON =
          this.props.useBundlingTool ||
          this.props.useTypeScript ||
          this.props.useLoader;

        if (this.props.useWebpack) {
          this.props.runScript = "dev";
        } else if (this.props.useTypeScript && !this.props.usePackageJSON) {
          // you should run tsc..
          this.props.runPostInstall = "tsc";
        }
      }.bind(this)
    );
  }

  configuring() {
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
  }

  default() {
    const options = {};
    extend(options, this.props);
    extend(options, {
      name: this.props.applicationName,
      description:
        "A simple yFiles application that creates a GraphComponent and enables basic input gestures.",
      appPath: this.config.get("appPath"),
      scriptsPath: this.config.get("scriptsPath"),
      libPath: this.config.get("libPath"),
      stylesPath: this.config.get("stylesPath"),
      postClassContent:
        this.props.language === "es6"
          ? "new " + this.props.applicationName + "();"
          : this.props.language === "javascript" && !this.props.useWebpack
          ? "new app." + this.props.applicationName + "();"
          : this.props.language === "typescript" && this.props.useWebpack
          ? "new " + this.props.applicationName + "();"
          : this.props.useWebpack
          ? 'new (yfiles.module("app")).' + this.props.applicationName + "();"
          : ""
    });

    if (this.props.projectType === promptOptions.projectType.PLAIN) {
      this.composeWith(require.resolve("../class/"), options);
    }
  }

  _getTypingsFilename() {
    const useVSCode =
      this.props.useVsCode ||
      (this.props.useTypeScript && !this.props.useIdeaProject);
    if (this.props.useES6Modules) {
      return useVSCode
        ? "yfiles-api-es-modules-vscode.d.ts"
        : "yfiles-api-es-modules-webstorm.d.ts";
    } else {
      return useVSCode
        ? "yfiles-api-umd-vscode.d.ts"
        : "yfiles-api-umd-webstorm.d.ts";
    }
  }

  _getStarterKitPath(projectType) {
    switch (projectType) {
      case promptOptions.projectType.ANGULAR:
        return 'https://github.com/yWorks/yfiles-angular-integration-basic'
      case promptOptions.projectType.REACT:
        return 'https://github.com/yWorks/yfiles-react-integration-basic'
      case promptOptions.projectType.VUE:
        return 'https://github.com/yWorks/yfiles-vue-integration-basic'
    }
  }

  _checkOutTag(repo, tag) {
    // https://stackoverflow.com/a/46140283
    return Git.Reference
      .dwim(repo, "refs/tags/" + tag)
      .then(function (ref) {
        return ref.peel(Git.Object.TYPE.COMMIT);
      })
      .then(function (ref) {
        return repo.getCommit(ref);
      })
      .then(function (commit) {
        return Git.Checkout
          .tree(repo, commit, {checkoutStrategy: Git.Checkout.STRATEGY.SAFE})
          .then(function () {
            return repo.setHeadDetached(commit, repo.defaultSignature,
              "Checkout: HEAD " + commit.id());
          })
      });
  }

  writing() {
    if (this.props.projectType !== promptOptions.projectType.PLAIN) {
      // copy necessary yfiles stuff beside it (to satisfy starter-kit requirements)
      const userLibraryBaseName = path.basename(this.props.yfilesPath)
      this.fs.copy(
        path.join(this.props.yfilesPath, "package.json"),
        this.destinationPath(path.join(userLibraryBaseName, 'package.json'))
      )
      this.fs.copy(
        path.join(this.props.yfilesPath, "demos-js/package.json"),
        this.destinationPath(path.join(userLibraryBaseName, 'demos-js/package.json'))
      )
      this.fs.copy(
        path.join(this.props.yfilesPath, "tools/**/*"),
        this.destinationPath(path.join(userLibraryBaseName, 'tools'))
      )
      this.fs.copy(
        path.join(this.props.yfilesPath, "/lib/**/*"),
        this.destinationPath(path.join(userLibraryBaseName, 'lib'))
      )
      this.fs.copy(
        this.props.licensePath,
        this.destinationPath(path.join(userLibraryBaseName, '/lib/license.json'))
      )

      // clone starter kit
      const gitPath = this._getStarterKitPath(this.props.projectType)
      const repositoryName = gitPath.substring(gitPath.lastIndexOf('/') + 1)
      this.$cloneDest = this.destinationPath(repositoryName)

      this.log(chalk.green(`\nDownloading starter-kit for ${this.props.projectType}\n`));
      return Git.Clone(gitPath, this.$cloneDest).then(repo => {
        return this._checkOutTag(repo, config.starterKitTag)
      }).then(() => {
        this.log(chalk.green(`Successfully cloned ${gitPath} to ${this.$cloneDest}`));
      }).catch(e => {
        this.log(chalk.yellow(`Could not clone ${gitPath}:\n${e.message}`));
      })
    }

    const libSrcBase = path.join(this.props.yfilesPath, this.props.useDevLib ? "lib-dev" : "lib")
    const appPath = "app";
    const scriptsPath = path.join(appPath, "scripts");
    const libPath = path.join(appPath, "lib");
    const stylesPath = path.join(appPath, "styles");
    const distPath = "dist/";
    const babelDest = "build/es5";

    // If we don't bundle at all, the deployment tool should output directly to dist/.
    // Else, the deployment tool should output the intermediate result to build/obf, where it will be picked
    // up by the bundling tool.
    const obfDest = this.props.useBundlingTool ? "build/obf/" : distPath;

    const obfSource = utils.unixPath(scriptsPath);

    const templateVars = {
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
      useDevLib: this.props.useDevLib,
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

    if (!this.fs.exists(libSrcBase)) {
      chalk.green(
        "\nPreparing yFiles library...\n"
      )
      const packageManager = this.props.buildChain === promptOptions.buildChain.NPM ? "npm" : "yarn"
      const preparePackagePath = path.join(this.props.yfilesPath, "tools/prepare-package")
      this.spawnCommandSync(packageManager, ["install"],{ cwd: preparePackagePath })
      this.spawnCommandSync(packageManager, ["run", "prepare-package"],{ cwd: preparePackagePath })
    }

    if (!this.props.useLocalNpm) {
      // copy the yFiles library files to the app/lib folder
      if (this.props.useES6Modules) {
        this.fs.copy(
          path.join(libSrcBase, "es-modules/**/*"),
          this.destinationPath(path.join(libPath, "yfiles"))
        );
        if (!this.props.useWebpack) {
          // with webpack, we use babel-polyfill instead
          this.fs.copy(
            path.join(libSrcBase, "umd/es2015-shim.js"),
            this.destinationPath(path.join(libPath, "es2015-shim.js"))
          );
        }
      } else {
        this.fs.copy(
          path.join(libSrcBase, "umd/"),
          this.destinationPath(path.join(libPath, "yfiles"))
        );
      }
      this.fs.copy(
        path.join(
          this.props.yfilesPath,
          "ide-support/" + this.props.typingsFilename
        ),
        this.destinationPath(
          path.join(appPath, "typings/" + this.props.typingsFilename)
        )
      );
    } else {
      const createNpmTypingsPath = path.join(
        path.relative("./", this.props.yfilesPath),
        "tools/create-npm-typings/"
      );
      if (this.props.useVsCode) {
        // we need to build the vscode typings for local npm modules
        this.log(chalk.green("\nBuilding yFiles typings for VSCode ...\n"));
        if (this.props.useYarn) {
          this.spawnCommandSync("yarn", [
            "--cwd",
            createNpmTypingsPath,
            "install"
          ]);
          this.spawnCommandSync("yarn", [
            "--cwd",
            createNpmTypingsPath,
            "npm-module-vscode"
          ]);
        } else {
          this.spawnCommandSync("npm", [
            "--prefix",
            createNpmTypingsPath,
            "install",
            createNpmTypingsPath
          ]);
          this.spawnCommandSync("npm", [
            "--prefix",
            createNpmTypingsPath,
            "run",
            "npm-module-vscode"
          ]);
        }
      } else {
        // build the webstorm npm typings (there may be the vscode typings currently)
        this.log(chalk.green("\nBuilding yFiles typings for WebStorm ...\n"));
        if (this.props.useYarn) {
          this.spawnCommandSync("yarn", [
            "--cwd",
            createNpmTypingsPath,
            "install"
          ]);
          this.spawnCommandSync("yarn", [
            "--cwd",
            createNpmTypingsPath,
            "npm-module-webstorm"
          ]);
        } else {
          this.spawnCommandSync("npm", [
            "--prefix",
            createNpmTypingsPath,
            "install",
            createNpmTypingsPath
          ]);
          this.spawnCommandSync("npm", [
            "--prefix",
            createNpmTypingsPath,
            "run",
            "npm-module-webstorm"
          ]);
        }
      }

      if (!this.props.useWebpack) {
        // with webpack, we use babel-polyfill instead
        this.fs.copy(
          path.join(this.props.yfilesPath, "lib/umd/es2015-shim.js"),
          this.destinationPath(
            path.join(path.join(appPath, "shim"), "es2015-shim.js")
          )
        );
      }
    }

    if (!this.props.useWebpack) {
      this.fs.copy(
        path.join(libSrcBase, "es-modules/yfiles.css"),
        this.destinationPath(path.join(stylesPath, "yfiles.css"))
      );
    }

    if (this.props.useIdeaProject) {
      this.fs.copyTpl(
        this.templatePath("idea/yFiles_for_HTML.xml"),
        this.destinationPath(
          path.join(".idea", "libraries", "yFiles_for_HTML.xml")
        ),
        templateVars
      );
      this.fs.copyTpl(
        this.templatePath("idea/jsLibraryMappings.xml"),
        this.destinationPath(path.join(".idea", "jsLibraryMappings.xml")),
        templateVars
      );
      this.fs.copyTpl(
        this.templatePath("idea/project.iml"),
        this.destinationPath(
          path.join(".idea", this.props.applicationName + ".iml")
        ),
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
      if (this.props.useES6Modules) {
        this.fs.copyTpl(
          this.templatePath("idea/webResources.xml"),
          this.destinationPath(path.join(".idea", "webResources.xml")),
          templateVars
        );
      }
    }

    templateVars.libPath = utils.unixPath(libPath);

    const pkg = this.fs.readJSON(this.destinationPath("package.json"), {
      description: "My first yFiles for HTML WebApp.",
      license: "unlicensed",
      private: true
    });

    pkg.name = pkg.name || toSlugCase(this.props.applicationName);
    pkg.version = pkg.version || "1.0.0";
    pkg.private = pkg.private || true;

    //
    // Write package.json for require.js
    //
    if (this.props.useLoader) {
      pkg.dependencies = pkg.dependencies || (pkg.dependencies = {});
      if (this.props.loadingType === promptOptions.loadingType.AMD) {
        pkg.dependencies["requirejs"] = "^2.3.6";
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
          typescript: "~3.7.5"
        }
      });

      this.props.runScript = "dev";
    }

    let webpackProps = null;
    if (this.props.useWebpack) {
      webpackProps = {
        configTemplate: "webpack4.config.ejs",
        productionParam: "--mode production",
        devParam: "--mode development",
        deps: {
          "@yworks/optimizer": "^1.3.2",
          webpack: "^4.43.0",
          "webpack-cli": "^3.3.11",
          "webpack-dev-server": "^3.11.0",
          "css-loader": "^3.5.3",
          "mini-css-extract-plugin": "^0.9.0",
          "babel-loader": "^8.1.0",
          "@babel/core": "^7.10.2",
          "@babel/preset-env": "^7.10.2",
          "core-js": "^3.6.5",
          "regenerator-runtime": "^0.13.5"
        },
        tsDeps: {
          "@babel/preset-typescript": "^7.10.1",
          "ts-loader": "^6.2.1",
          typescript: "~3.7.5"
        }
      };
    }

    //
    // Webpack without Typescript
    //
    if (this.props.useWebpack && !this.props.useTypeScript) {
      const devDeps = {};
      extend(devDeps, webpackProps.deps);

      const pkgScripts = {
        production: "webpack " + webpackProps.productionParam,
        dev: "webpack " + webpackProps.devParam,
        start: "webpack-dev-server " + webpackProps.devParam + " --open"
      };

      this.props.runScript = "dev";

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
    else if (this.props.useWebpack && this.props.useTypeScript) {
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

      const devDependencies = extend(
        extend({}, webpackProps.deps),
        webpackProps.tsDeps
      );

      extend(pkg, {
        scripts: {
          production: "webpack " + webpackProps.productionParam,
          dev: "webpack " + webpackProps.devParam,
          start: "webpack-dev-server " + webpackProps.devParam + " --open"
        },
        devDependencies: devDependencies
      });

      this.props.runScript = "dev";
    }

    if (this.props.useLocalNpm) {
      const yfilesLibPath = path.join(libSrcBase, 'es-modules')
      const yFilesPackageJson = require(path.resolve(path.join(yfilesLibPath, 'package.json')))
      const yFilesNpmVersion = yFilesPackageJson.version
      let yFilesDepPath = path.resolve(yfilesLibPath, `yfiles-${yFilesNpmVersion}.tgz`)
      extend(pkg, {
        dependencies: {
          yfiles: yFilesDepPath
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
      if (!this.props.useTypeScript) {
        const jsconfig = this.fs.readJSON(
          this.destinationPath("jsconfig.json"),
          {}
        );
        jsconfig.exclude = ["node_modules", appPath + "/lib", "dist", "build"];
        this.fs.writeJSON(this.destinationPath("jsconfig.json"), jsconfig);
      }

      const npmScripts = pkg.scripts;
      if (npmScripts && Object.keys(npmScripts).length > 0) {
        const tasksPath = path.join(".vscode", "tasks.json");
        const tasksJson = this.fs.readJSON(tasksPath, {});

        const tasks = [];

        Object.keys(npmScripts).forEach(function(scriptName) {
          const taskDef = {
            type: "npm",
            problemMatcher: [],
            script: scriptName
          };
          if (scriptName === "build" || scriptName === "dev") {
            taskDef.group = {
              kind: "build",
              isDefault: true
            };
          }
          tasks.push(taskDef);
        });

        extend(tasksJson, {
          version: "2.0.0",
          tasks: tasks
        });

        this.fs.writeJSON(this.destinationPath(tasksPath), tasksJson);
      }
    }
  }

  _getPackageVersion(packageJsonStr) {
    const packageJson = JSON.parse(packageJsonStr)
    return packageJson.version
  }

  install() {
    if (this.props.projectType !== promptOptions.projectType.PLAIN) {

      // adjust the references to the user's environment
      const userLibraryBaseName = path.basename(this.props.yfilesPath)
      const libraryPackage = fs.readFileSync(this.destinationPath(path.join(userLibraryBaseName, '/lib/es-modules/package.json')), 'utf8')
      const libraryPackageName = `yfiles-${this._getPackageVersion(libraryPackage)}-dev.tgz`

      const packageJsonPath = path.join(this.$cloneDest, '/package.json')
      const starterKitPackage = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))

      const starterKitPreinstall = starterKitPackage.scripts.preinstall
      let starterKitLibraryReference
      const match = /cd\s+\.\.\/([^\s]*)\s*&&/.exec(starterKitPreinstall)
      if (match && match.length > 1) {
        starterKitLibraryReference = match[1]
      }

      if (starterKitLibraryReference) {
        const modifiedPackage = Object.assign({}, starterKitPackage)
        modifiedPackage.scripts.preinstall = starterKitPackage.scripts.preinstall.replace(new RegExp(starterKitLibraryReference, 'g'), userLibraryBaseName)
        modifiedPackage.scripts.postinstall = starterKitPackage.scripts.postinstall.replace(new RegExp(starterKitLibraryReference, 'g'), userLibraryBaseName)
        modifiedPackage.dependencies.yfiles = `../${userLibraryBaseName}/lib-dev/es-modules/${libraryPackageName}`
        fs.writeFileSync(packageJsonPath, JSON.stringify(modifiedPackage, null, 2), 'utf8')
      }

      this.log(chalk.green(
        "\nInstalling dependencies of starter-kit...\n"
      ))
      const gitPath = this._getStarterKitPath(this.props.projectType)
      const cloneDest = this.destinationPath(gitPath.substring(gitPath.lastIndexOf('/') + 1))
      const packageManager = this.props.buildChain === promptOptions.buildChain.NPM ? "npm" : "yarn"
      this.spawnCommandSync(packageManager, ["install"],{cwd: cloneDest})
    }

    if (this.props.usePackageJSON) {
      this.installDependencies({
        bower: false,
        yarn: this.props.useYarn,
        npm: !this.props.useYarn
      });
    }
  }

  end() {
    if (this.props.projectType !== promptOptions.projectType.PLAIN) {
      const startCommand = this.props.projectType === promptOptions.projectType.VUE ? 'serve' : 'start'
      const startPrefix = this.props.buildChain === promptOptions.buildChain.NPM ? 'npm run' : 'yarn'
      this.log(
        chalk.green(
          `\nFinished your scaffold. Type '${startPrefix} ${startCommand}' to start the development server and serve the application.\n`
        )
      );
    }

    if (this.props.usePackageJSON) {
      if (this.props.runScript) {
        this.log(
          chalk.green(
            "\nFinished your scaffold. Running '" +
              this.props.runScript +
              "' for you...\n"
          )
        );
        this.spawnCommandSync(this.props.useYarn ? "yarn" : "npm", [
          "run",
          this.props.runScript
        ]);
      }
      if (this.props.runPostInstall) {
        this.log(
          chalk.green(
            "\nAlmost done. Now running '" +
              this.props.runPostInstall +
              "' for you...\n"
          )
        );
        this.spawnCommandSync(this.props.runPostInstall);
      }
    }
  }
};
