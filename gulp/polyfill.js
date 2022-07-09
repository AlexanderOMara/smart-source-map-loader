/* eslint-disable global-require */

// Older versions of node need a little help.
// Transpile dependencies and polyfill their environment.

// Process node_modules with Babel.
require('@babel/register')({
	extends: './.babelrc',
	ignore: []
});

const util = require('util');
const stream = require('stream');

// Add a mostly compatible util.promisify implementation if missing.
if (!util.promisify) {
	util.promisify = function (func) {
		return function () {
			return new Promise((resolve, reject) => {
				// eslint-disable-next-line no-invalid-this, prefer-rest-params
				func.apply(this, [
					// eslint-disable-next-line prefer-rest-params
					...arguments,
					(err, data) => {
						if (err) {
							reject(err);
							return;
						}
						resolve(data);
					}
				]);
			});
		};
	};
}

// Add a mostly compatible stream.pipeline implementation if missing.
if (!stream.pipeline) {
	stream.pipeline = require('pump');
}

// Polyfill Promise finally method if missing.
if (!Promise.prototype.finally) {
	require('promise.prototype.finally').shim();
}
