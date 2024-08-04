/* eslint-disable global-require */

'use strict';

const nodeVersion = process.versions.node.split('.').map(Number);

if (nodeVersion[0] < 17) {
	exports['4.0.0'] = require('webpack-4-0-0');
	exports['4.47.0'] = require('webpack-4-47-0');
}
if (nodeVersion[0] > 10 || (nodeVersion[0] === 10 && nodeVersion[1] >= 13)) {
	if (nodeVersion[0] < 17) {
		exports['5.0.0'] = require('webpack-5-0-0');
	}
	exports['latest'] = require('webpack');
}
