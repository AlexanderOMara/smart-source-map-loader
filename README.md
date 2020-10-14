# Smart Source Map Loader

A Smart Source Map Loader for Webpack

[![npm](https://img.shields.io/npm/v/smart-source-map-loader.svg)](https://npmjs.com/package/smart-source-map-loader)
[![node](https://img.shields.io/node/v/smart-source-map-loader.svg)](https://nodejs.org)

[![dependencies](https://img.shields.io/david/AlexanderOMara/smart-source-map-loader.svg)](https://david-dm.org/AlexanderOMara/smart-source-map-loader)
[![size](https://packagephobia.now.sh/badge?p=smart-source-map-loader)](https://packagephobia.now.sh/result?p=smart-source-map-loader)
[![downloads](https://img.shields.io/npm/dm/smart-source-map-loader.svg)](https://npmcharts.com/compare/smart-source-map-loader?minimal=true)

[![travis-ci](https://travis-ci.org/AlexanderOMara/smart-source-map-loader.svg?branch=master)](https://travis-ci.org/AlexanderOMara/smart-source-map-loader)


# Overview

This is a module which will read any existing source maps on a file and pass them to Webpack. In this way compiled code can be bundled with source maps to the original source files.

It is similar in concept to the `source-map-loader` module, but with several major usability improvements. These improvements mainly center around the issue where that module does not correctly resolve the original source paths in most cases, leading to conflicting or wrong paths in the resulting source maps. In order to solve these and several other minor issues, a smarter loader had to be written, and so this loader was created.


# Features

-   Correctly resolves the path of the original source files relative to the source maps to avoid conflicts and wrong paths in the resulting bundle.
-   Only accepts well-formed source map comments (with one exception for path encoding) at the end of the file (other comments are almost always extraneous).
-   Handles both spec-compliant encoded and unencoded comment paths (for compatibility with the rest of the ecosystem, typically a non-issue).
-   Correctly handles external and data URI source maps.
-   Correctly handles the indexed format and reading source contents from disk when needed.
-   Avoids adding absolute paths where possible.
-   Strong error handling to produce helpful warning messages when a source map is invalid.
-   Well-tested against the real Webpack module.


# Usage

Requires Webpack 4+.

Just add the dependency with npm:

```sh
npm i -D smart-source-map-loader
```

Or yarn:

```sh
yarn add -D smart-source-map-loader
```

And configure it to parse your source files (`.js` and `.mjs` in this example):

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.m?js$/i,
        use: ['smart-source-map-loader'],
        enforce: 'pre'
      }
    ]
  }
};
```

For performance reasons you may wish to exclude `node_modules` in your setup.


# Bugs

If you find a bug or have compatibility issues, please open a ticket under issues section for this repository.


# License

Copyright (c) 2018-2020 Alexander O'Mara

Licensed under the Mozilla Public License, v. 2.0.

If this license does not work for you, feel free to contact me.
