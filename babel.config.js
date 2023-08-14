'use strict';

const pkg = require('./package.json');

module.exports = api => {
	const env = api.env();
	api.cache(() => env);
	return {
		presets: [
			[
				'@babel/preset-env',
				{
					modules: 'commonjs',
					targets: {
						node: '6.14.3'
					}
				}
			]
		],
		plugins: [
			[
				'search-and-replace',
				{
					rules: [
						{
							search: '#{VERSION}',
							replace: pkg.version
						},
						{
							search: '#{NAME}',
							replace: pkg.name
						}
					]
				}
			]
		]
	};
};
