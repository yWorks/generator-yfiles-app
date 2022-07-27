# generator-yfiles-app [![NPM version][npm-image]][npm-url]
> **Warning** <br>
> This yeoman generator is deprecated and no longer maintained. For better ways to bootstrap [yFiles for HTML](https://www.yworks.com/yfileshtml) applications, please see [Alternative ways to scaffold yFiles for HTML applications](#alternative-ways-to-scaffold-yfiles-for-html-applications).

> A yeoman generator that scaffolds a [yFiles for HTML](https://www.yworks.com/yfileshtml) powered application (up to yFiles for HTML 2.4). Requires a local yFiles for HTML package which can be [obtained and evaluated here](https://www.yworks.com/products/yfiles-for-html/evaluate).

Watch [this Youtube screencast](https://www.youtube.com/watch?v=fgY4ezIfVjI&t=1160s) to see the generator in action.

## Alternative ways to scaffold yFiles for HTML applications

Besides this Yeoman generator, there are more ways to scaffold yFiles for HTML applications with different features and
frameworks:

#### yFiles Dev Suite

The [yFiles Dev Suite](https://www.npmjs.com/package/yfiles-dev-suite) is a graphical interface that facilitates working with a [yFiles for HTML](https://www.yworks.com/products/yfiles-for-html) software package:

* Integration with [my.yworks.com](https://my.yworks.com/) for a simplified evaluation process and direct communication with the yWorks support team.
* Create your own yFiles app with just a few clicks.
* Browse and adapt the plethora of [demo applications](https://live.yworks.com/demos/), manage your changes through integrated diffing, and spawn your own projects from one of the samples as a starting point.

See how it works, in [this video](https://www.youtube.com/watch?v=yzRAB-oP_uw) on YouTube.

#### App Generator

The [App Generator](https://www.yworks.com/products/app-generator) is a tool that lets you interactively create a diagram application prototype to visualize your data with very little programming knowledge. It generates and exports the source code of configurable prototype applications with different frameworks (e.g. React, Vue.js or Angular) with features like editing, context menu, graph search, printing and graph editing capabilities.

## Installation of this Yeoman generator

First, install [Yeoman](http://yeoman.io) and generator-yfiles-app using [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/) (we assume you have pre-installed [node.js](https://nodejs.org/)). 
The current version scaffolds yFiles for HTML 2.4 projects.

```bash
npm install -g yo
npm install -g generator-yfiles-app
```
or
```bash
yarn global add yo
yarn global add generator-yfiles-app
```

Then generate your new project:

```bash
yo yfiles-app
```

Simply answer a few questions and everything you need for your yFiles app is at the right place.

## Scaffold previous yFiles for HTML versions

To scaffold a **yFiles for HTML 1.3** project, please install v0.9.4 of the generator-yfiles-app, i.e:

```bash
npm install -g generator-yfiles-app@0.9.4
```

To scaffold a **yFiles for HTML 1.4** project, please install v0.9.5 of the generator-yfiles-app, i.e:

```bash
npm install -g generator-yfiles-app@0.9.5
```

To scaffold a **yFiles for HTML 2.0** project, please install v1.2.0 of the generator-yfiles-app, i.e:

```bash
npm install -g generator-yfiles-app@1.2.0
```

To scaffold a **yFiles for HTML 2.1** project, please install v2.2.2 of the generator-yfiles-app, i.e:

```bash
npm install -g generator-yfiles-app@2.2.2
```

To scaffold a **yFiles for HTML 2.2** project, please install v3.0.6 of the generator-yfiles-app, i.e:

```bash
npm install -g generator-yfiles-app@3.0.6
```

To scaffold a **yFiles for HTML 2.3** project, please install v4.0.2 of the generator-yfiles-app, i.e:

```bash
npm install -g generator-yfiles-app@4.0.2
```

## About this generator

This generator scaffolds a yFiles for HTML application. It allows you to choose between different build tools and 
programming languages (ECMAScript 5, ECMAScript 6 (+Babel) and TypeScript).

Here is a rundown of the options you have:

#### Which framework do you want to use?
You can choose between a pre-build starter kit with framework integration (Angular, React, Vue.js), or create a plain project where the generator prompts you for further options.

* No framework
* Angular
* React
* Vue.js

#### Application name
The name of the app and of the first class. Only valid JavaScript identifiers (consisting of \[a-zA-Z$_]) are accepted.

#### Path of yFiles for HTML package
The path to the root of a valid yFiles for HTML package (e.g. "path/to/yFilesPackage"). This package must contain the following folders: 
 * "lib/umd"
 * "lib/es-modules"
 * "tools"
 * "ide-support"

#### Path of license file
The path to a yFiles for HTML license.json file. The generator tries to guess the location of the license file
based on the yFiles for HTML package path. You may however want to specify a custom path here ("path/to/license.json").

#### Which kind of yFiles modules do you want to use?
Choose whether you want to consume the yFiles library as a local NPM dependency, as ES Modules or as UMD modules. 
 * **Local NPM dependency** Install yFiles as local NPM dependency. This variant provides the best IDE and toolchain 
 integration due to the general support of NPM dependencies.
 * **ES Modules** Use the yFiles ES Modules and access the yFiles API members using 
 [import statements](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import). 
 Selecting this option *skips most of the following prompts*, as these are not applicable when using ES Modules. 
 The resulting project will use webpack, so the resulting application will work in most browsers. 
 * **[UMD](https://github.com/umdjs/umd)** Use the "traditional" modules that work with AMD/require.js, 
 commonjs (NodeJS) and as browser-globals.

#### Module loading method
Decide whether you want to load the library via
 * [AMD require](http://requirejs.org/docs/whyamd.html) or
 * \<script\>-tags.
This option will not be available when webpack has been selected as build tool, as the resulting bundle is 
included via \<script\>-tag.

#### Which modules do you want to use?
Choose which yFiles modules your app will need. For an overview of these take a look at the Developer's 
Guide's [module section](http://docs.yworks.com/yfileshtml/#/dguide/introduction-modules).
The generator will automatically optimize the set of modules to load.

#### Which language variant do you want to use?
Depending on your previous choices not all of the following choices for the source language will be available:
* **ECMAScript 6** Write plain modern JavaScript (version 6) without a transpilation step. 
Code will not run without a transpile-step in Internet Explorer and other browsers from the stone age.
If Webpack was selected as well, the webpack [Babel loader](https://github.com/babel/babel-loader) is preconfigured
in the Webpack configuration. 
* **[TypeScript](http://www.typescriptlang.org/)** Use TypeScript instead of plain JavaScript.
* **ES5** Use old ES5 for writing your code without using ES6 features like `class` etc. 

#### Which package manager would you like to use?
Decide which package manager you want to use for managing packages and dependencies: 
 * [npm](https://www.npmjs.com/) or
 * [yarn](https://yarnpkg.com/)

This option will not be available for those variants where no third party software is required 
for transpiling or loading the app.

#### What else do you want?
 * **Use development library** Uses the yFiles development library with runtime type checking. Remember to use the
  production library for production releases.
 Further information can be found [here](http://docs.yworks.com/yfileshtml/#/dguide/yfiles_development_mode).
 * **Visual Studio Code integration** Creates additional files required for [Visual Studio Codes'](https://code.visualstudio.com/) IntelliSense as well as a task runner if applicable.
 * **WebStorm/PHP-Storm/Intellij IDEA Ultimate Project files** Creates a simple project file structure for [JetBrains' IDEs](https://www.jetbrains.com/)' with libraries and directories set up correctly.

## License
MIT © [yWorks GmbH](https://www.yworks.com)


[npm-image]: https://badge.fury.io/js/generator-yfiles-app.svg
[npm-url]: https://npmjs.org/package/generator-yfiles-app
