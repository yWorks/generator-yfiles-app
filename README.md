# generator-yfiles-app [![NPM version][npm-image]][npm-url]
> A yeoman generator that scaffolds a yFiles for HTML powered application. Requires local yFiles package.

## Installation

First, install [Yeoman](http://yeoman.io) and generator-yfiles-app using [npm](https://www.npmjs.com/) (we assume you have pre-installed [node.js](https://nodejs.org/)).

```bash
npm install -g yo
npm install -g generator-yfiles-app
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

Further information about the available tasks can be found in the generated READMEs.

#### Module loading method
Decide whether you want to load the library via [AMD require](http://requirejs.org/docs/whyamd.html) or via \<script\>-tags.

#### Which modules do you want to use?
Choose which yFiles modules your app will need. For an overview of these take a look at the Developer's Guide's [module section](http://docs.yworks.com/yfileshtmlv2/index.html#/dguide/modules).
The generator will automatically optimize the requires.

#### What else do you want?
 * **Use yfiles-typeinfo.js** Includes the yfiles-typeinfo.js file which provides runtime type checking during development time. It is recommended to exclude this file in releases.
Further information can be found [here](http://docs.yworks.com/yfileshtmlv2/index.html#/dguide/DevelopmentSupport#DevelopmentSupport-Checks)
 * **npm & git** Runs the [node generator](https://github.com/yeoman/generator-node), which initializes a npm package and git.
 * **[babel](https://babeljs.io/)** Enables you to use ECMAScript 6 (Only available if you have chosen a build tool).
 * **[TypeScript](http://www.typescriptlang.org/) & [DefinitelyTyped (tsd)](http://definitelytyped.org/)** Use TypeScript instead of plain JavaScript (Only available if have chosen a build tool). 
Additionally TypeScript definition manager ([tsd](http://definitelytyped.org/tsd/)) will be installed, which allows you to easily download and reference Typescript definition files.

Choosing TypeScript will disable Babel.

## Getting To Know Yeoman

Yeoman has a heart of gold. He&#39;s a person with feelings and opinions, but he&#39;s very easy to work with. If you think he&#39;s too opinionated, he can be easily convinced. Feel free to [learn more about him](http://yeoman.io/).

## License
MIT © [yWorks GmbH](http://www.yworks.com)


[npm-image]: https://badge.fury.io/js/generator-yfiles-app.svg
[npm-url]: https://npmjs.org/package/generator-yfiles-app
