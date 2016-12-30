# generator-yfiles-app [![NPM version][npm-image]][npm-url]
> A yeoman generator that scaffolds a [yFiles for HTML](http://www.yworks.com/yfileshtml) powered application. Requires a local yFiles for HTML package which can be [obtained and evaluated here](https://www.yworks.com/products/yfiles-for-html/evaluate).

## Installation

First, install [Yeoman](http://yeoman.io) and generator-yfiles-app using [npm](https://www.npmjs.com/) (we assume you have pre-installed [node.js](https://nodejs.org/)). 
The current version scaffolds yFiles for HTML 2.0 projects.

```bash
npm install -g yo
npm install -g generator-yfiles-app
```

To scaffold a yFiles for HTML 1.3 project, please install v0.9.4 of the generator-yfiles-app, i.e:

```bash
npm install -g generator-yfiles-app@0.9.4
```

Then generate your new project:

```bash
yo yfiles-app
```

Simply answer a few questions and everything you need for your yFiles app is at the right place.

## About this generator

This generator scaffolds a yFiles for HTML application. It allows you to choose between different build tools and programming languages (ECMAScript 5, ECMAScript 6 (+Babel) and TypeScript).

Here is a rundown of the options you have:

#### Application name
The name of the app, the first class and the generated main files. Only valid JavaScript identifiers (consisting of \[a-zA-Z$_]) are accepted.

#### Module name
The name of the module/namespace the first class shall live in. Only valid JavaScript identifiers (consisting of \[a-zA-Z$_]) are accepted.

#### Path of yFiles for HTML package
The path to the root of a valid yFiles for HTML package (e.g. "path/to/yFilesPackage"). This package must contain the following folders: 
 * "lib/yfiles"
 * "deployment"
 * "ide-support"

#### Path of license file
Usually your yFiles package contains a license.js file at top level. If not, you may provide a path to a valid license, e.g. "path/to/license.js".

#### Which build tool do you want to use?
You can choose between those build tools:
 * **none**: No build file is provided and you can run your app directly without the need of a compile step.
 * **[Grunt](http://gruntjs.com/)**: A simple Gruntfile.js is provided, that packages the required yFiles modules to a single file but leaves your code unchanged.
 * **Grunt + [Browserify](http://browserify.org/)** Packages and minifies all JavaScript resources to a single file using Browserify.
 * **Grunt + [Webpack](https://github.com/webpack/webpack)** Packages all JavaScript resources to a single file using Webpack.

#### Module loading method
Decide whether you want to load the library via
 * [AMD require](http://requirejs.org/docs/whyamd.html),
 * [systemjs](https://github.com/systemjs/systemjs) or
 * \<script\>-tags.
This option will not be available when Webpack or Browserify have been selected as build tool, as the resulting package is included via \<script\>-tag.

#### Which modules do you want to use?
Choose which yFiles modules your app will need. For an overview of these take a look at the Developer's Guide's [module section](http://docs.yworks.com/yfileshtmlv2/index.html#/dguide/modules).
The generator will automatically optimize the requires.

#### What else do you want?
 * **Use yfiles-typeinfo.js** Includes the yfiles-typeinfo.js file which provides runtime type checking during development time. It is recommended to exclude this file in releases.
Further information can be found [here](http://docs.yworks.com/yfileshtmlv2/index.html#/dguide/DevelopmentSupport#DevelopmentSupport-Checks)
 * **npm & git** Runs the [node generator](https://github.com/yeoman/generator-node), which initializes a npm package and git.
 * **Visual Studio Code integration** Creates additional files required for [Visual Studio Codes'](https://code.visualstudio.com/) IntelliSense as well as a task runner if applicable.
 * **ECMAScript 6 (+[babel](https://babeljs.io/))** Enables you to use ECMAScript 6 (only available if you have chosen a build tool).
 * **[TypeScript](http://www.typescriptlang.org/)** Use TypeScript instead of plain JavaScript (only available if have chosen a build tool).

Choosing TypeScript will disable ECMAScript (+Babel).

## License
MIT © [yWorks GmbH](http://www.yworks.com)


[npm-image]: https://badge.fury.io/js/generator-yfiles-app.svg
[npm-url]: https://npmjs.org/package/generator-yfiles-app
