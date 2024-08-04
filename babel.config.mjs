import {readFileSync} from 'node:fs';

const {name, version, engines} = JSON.parse(readFileSync('./package.json'));

const node = engines.node
	.split(/[^\d.]+/)
	.filter(s => s.length)
	.map(s => [...s.split('.').map(s => +s || 0), 0, 0].slice(0, 3))
	.sort((a, b) => a[2] - b[2])
	.sort((a, b) => a[1] - b[1])
	.sort((a, b) => a[0] - b[0])[0]
	.join('.');

export default api => {
	const env = api.env();
	api.cache(() => env);
	return {
		presets: [
			[
				'@babel/preset-env',
				{
					modules: 'commonjs',
					targets: {
						node
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
							replace: version
						},
						{
							search: '#{NAME}',
							replace: name
						}
					]
				}
			]
		]
	};
};
