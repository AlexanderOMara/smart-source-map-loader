import {strictEqual, deepStrictEqual} from 'assert';
import path from 'path';

import MemoryFs from 'memory-fs';
import nodeRequireFunction from 'node-require-function';

import {Exception} from './exception';

const exceptionMessagePrefix = new Exception('').message;

async function webpackAsync(webpack, options, properties) {
	const compiler = webpack(options);
	if (properties) {
		for (const p of Object.keys(properties)) {
			compiler[p] = properties[p];
		}
	}
	const stats = await new Promise((resolve, reject) => {
		compiler.run((err, stats) => {
			if (stats) {
				if (!err && stats.hasErrors()) {
					// eslint-disable-next-line prefer-destructuring
					err = stats.compilation.errors[0];
				}
			}
			if (err) {
				reject(err);
				return;
			}
			resolve(stats);
		});
	});
	return {
		compiler,
		stats
	};
}

async function webpackMemory(webpack, info) {
	const fnCode = 'test.js';
	const fnMap = `${fnCode}.map`;
	const {compiler, stats} = await webpackAsync(
		webpack,
		{
			entry: info.entry,
			mode: 'development',
			devtool: 'source-map',
			output: {
				filename: fnCode,
				path: '/'
			},
			module: {
				rules: [
					{
						test: /\.js$/,
						use: {
							loader: path.resolve('.')
						}
					}
				]
			}
		},
		{
			outputFileSystem: new MemoryFs()
		}
	);
	const fsData = compiler.outputFileSystem.data;
	const code = fsData[fnCode].toString('utf8');
	const map = fsData[fnMap].toString('utf8');
	return {
		compiler,
		stats,
		code,
		map
	};
}

function listSources(map, skipWebpack = true, sorted = true) {
	const sources = map.sources || [];
	const sourcesContent = map.sourcesContent || [];
	const pairs = [];
	for (let i = 0; i < sources.length; i++) {
		const source = sources[i];
		if (skipWebpack && !source.indexOf('webpack:///webpack/')) {
			continue;
		}
		pairs.push({
			source,
			content: sourcesContent[i]
		});
	}
	if (sorted) {
		pairs.sort((a, b) => {
			if (a < b) {
				return -1;
			}
			if (b < a) {
				return 1;
			}
			return 0;
		});
	}
	return {
		names: pairs.map(e => e.source),
		pairs
	};
}

function testFixtures(version, webpack) {
	const istr = `webpack@${version}: fixtures`;
	const urlPrefix =
		+version.split('.')[0] < 5
			? 'webpack:///'
			: 'webpack://smart-source-map-loader/';

	test(`${istr}: content`, async () => {
		const {stats, map} = await webpackMemory(webpack, {
			entry: './spec/fixtures/content/min'
		});
		const mapData = JSON.parse(map);
		const sources = listSources(mapData);
		deepStrictEqual(sources.names, [
			`${urlPrefix}spec/fixtures/content/one.js`,
			`${urlPrefix}spec/fixtures/content/two.js`
		]);
		for (const pair of sources.pairs) {
			strictEqual(typeof pair.content, 'string');
		}
		const {errors, warnings} = stats.compilation;
		deepStrictEqual(errors, []);
		deepStrictEqual(warnings, []);
	});

	test(`${istr}: indexed`, async () => {
		// No longer supported by webpack?
		if (version === 'latest') {
			return;
		}

		const {stats, map} = await webpackMemory(webpack, {
			entry: './spec/fixtures/indexed/min'
		});
		const mapData = JSON.parse(map);
		const sources = listSources(mapData);
		deepStrictEqual(sources.names, [
			`${urlPrefix}spec/fixtures/indexed/one.js`,
			`${urlPrefix}spec/fixtures/indexed/two.js`
		]);
		for (const pair of sources.pairs) {
			strictEqual(typeof pair.content, 'string');
		}
		const {errors, warnings} = stats.compilation;
		deepStrictEqual(errors, []);
		deepStrictEqual(warnings, []);
	});

	test(`${istr}: external`, async () => {
		const {stats, map} = await webpackMemory(webpack, {
			entry: './spec/fixtures/external/min'
		});
		const mapData = JSON.parse(map);
		const sources = listSources(mapData);
		deepStrictEqual(sources.names, [
			`${urlPrefix}spec/fixtures/external/one.js`,
			`${urlPrefix}spec/fixtures/external/two.js`
		]);
		for (const pair of sources.pairs) {
			strictEqual(typeof pair.content, 'string');
		}
		const {errors, warnings} = stats.compilation;
		deepStrictEqual(errors, []);
		deepStrictEqual(warnings, []);
	});

	test(`${istr}: content-and-external`, async () => {
		const {stats, map} = await webpackMemory(webpack, {
			entry: './spec/fixtures/content-and-external/min'
		});
		const mapData = JSON.parse(map);
		const sources = listSources(mapData);
		deepStrictEqual(sources.names, [
			`${urlPrefix}spec/fixtures/content-and-external/one.js`,
			`${urlPrefix}spec/fixtures/content-and-external/two.js`
		]);
		for (const pair of sources.pairs) {
			strictEqual(typeof pair.content, 'string');
		}
		const {errors, warnings} = stats.compilation;
		deepStrictEqual(errors, []);
		deepStrictEqual(warnings, []);
	});

	test(`${istr}: datauri-base64`, async () => {
		const {stats, map} = await webpackMemory(webpack, {
			entry: './spec/fixtures/datauri-base64/min'
		});
		const mapData = JSON.parse(map);
		const sources = listSources(mapData);
		deepStrictEqual(sources.names, [
			`${urlPrefix}spec/fixtures/datauri-base64/one.js`,
			`${urlPrefix}spec/fixtures/datauri-base64/two.js`
		]);
		for (const pair of sources.pairs) {
			strictEqual(typeof pair.content, 'string');
		}
		const {errors, warnings} = stats.compilation;
		deepStrictEqual(errors, []);
		deepStrictEqual(warnings, []);
	});

	test(`${istr}: datauri-utf8`, async () => {
		const {stats, map} = await webpackMemory(webpack, {
			entry: './spec/fixtures/datauri-utf8/min'
		});
		const mapData = JSON.parse(map);
		const sources = listSources(mapData);
		deepStrictEqual(sources.names, [
			`${urlPrefix}spec/fixtures/datauri-utf8/one.js`,
			`${urlPrefix}spec/fixtures/datauri-utf8/two.js`
		]);
		for (const pair of sources.pairs) {
			strictEqual(typeof pair.content, 'string');
		}
		const {errors, warnings} = stats.compilation;
		deepStrictEqual(errors, []);
		deepStrictEqual(warnings, []);
	});

	test(`${istr}: root-relative`, async () => {
		const {stats, map} = await webpackMemory(webpack, {
			entry: './spec/fixtures/root-relative/min'
		});
		const mapData = JSON.parse(map);
		const sources = listSources(mapData);
		deepStrictEqual(sources.names, [
			`${urlPrefix}spec/fixtures/root-relative/root/one.js`,
			`${urlPrefix}spec/fixtures/root-relative/root/two.js`
		]);
		for (const pair of sources.pairs) {
			strictEqual(typeof pair.content, 'string');
		}
		const {errors, warnings} = stats.compilation;
		deepStrictEqual(errors, []);
		deepStrictEqual(warnings, []);
	});

	test(`${istr}: root-relative-dot`, async () => {
		const {stats, map} = await webpackMemory(webpack, {
			entry: './spec/fixtures/root-relative-dot/min'
		});
		const mapData = JSON.parse(map);
		const sources = listSources(mapData);
		deepStrictEqual(sources.names, [
			`${urlPrefix}spec/fixtures/root-relative-dot/one.js`,
			`${urlPrefix}spec/fixtures/root-relative-dot/two.js`
		]);
		for (const pair of sources.pairs) {
			strictEqual(typeof pair.content, 'string');
		}
		const {errors, warnings} = stats.compilation;
		deepStrictEqual(errors, []);
		deepStrictEqual(warnings, []);
	});

	test(`${istr}: root-relative-dot-slash`, async () => {
		const {stats, map} = await webpackMemory(webpack, {
			entry: './spec/fixtures/root-relative-dot-slash/min'
		});
		const mapData = JSON.parse(map);
		const sources = listSources(mapData);
		deepStrictEqual(sources.names, [
			`${urlPrefix}spec/fixtures/root-relative-dot-slash/one.js`,
			`${urlPrefix}spec/fixtures/root-relative-dot-slash/two.js`
		]);
		for (const pair of sources.pairs) {
			strictEqual(typeof pair.content, 'string');
		}
		const {errors, warnings} = stats.compilation;
		deepStrictEqual(errors, []);
		deepStrictEqual(warnings, []);
	});

	test(`${istr}: root-relative-parent`, async () => {
		const {stats, map} = await webpackMemory(webpack, {
			entry: './spec/fixtures/root-relative-parent/min'
		});
		const mapData = JSON.parse(map);
		const sources = listSources(mapData);
		deepStrictEqual(sources.names, [
			`${urlPrefix}spec/fixtures/root/one.js`,
			`${urlPrefix}spec/fixtures/root/two.js`
		]);
		for (const pair of sources.pairs) {
			strictEqual(typeof pair.content, 'string');
		}
		const {errors, warnings} = stats.compilation;
		deepStrictEqual(errors, []);
		deepStrictEqual(warnings, []);
	});

	test(`${istr}: external-root`, async () => {
		const {stats, map} = await webpackMemory(webpack, {
			entry: './spec/fixtures/external-root/min'
		});
		const mapData = JSON.parse(map);
		const sources = listSources(mapData);
		deepStrictEqual(sources.names, [
			`${urlPrefix}spec/fixtures/external-root/map/src/one.js`,
			`${urlPrefix}spec/fixtures/external-root/map/src/two.js`
		]);
		for (const pair of sources.pairs) {
			strictEqual(typeof pair.content, 'string');
		}
		const {errors, warnings} = stats.compilation;
		deepStrictEqual(errors, []);
		deepStrictEqual(warnings, []);
	});

	test(`${istr}: sources-relative`, async () => {
		const {stats, map} = await webpackMemory(webpack, {
			entry: './spec/fixtures/sources-relative/min'
		});
		const mapData = JSON.parse(map);
		const sources = listSources(mapData);
		if (version === 'latest') {
			deepStrictEqual(sources.names, [
				`${urlPrefix}spec/fixtures/sources-relative/./one.js`,
				`${urlPrefix}spec/fixtures/sources-relative/./two.js`
			]);
		} else {
			deepStrictEqual(sources.names, [
				`${urlPrefix}spec/fixtures/sources-relative/one.js`,
				`${urlPrefix}spec/fixtures/sources-relative/two.js`
			]);
		}
		for (const pair of sources.pairs) {
			strictEqual(typeof pair.content, 'string');
		}
		const {errors, warnings} = stats.compilation;
		deepStrictEqual(errors, []);
		deepStrictEqual(warnings, []);
	});

	test(`${istr}: url-relative`, async () => {
		const {stats, map} = await webpackMemory(webpack, {
			entry: './spec/fixtures/url-relative/min'
		});
		const mapData = JSON.parse(map);
		const sources = listSources(mapData);
		deepStrictEqual(sources.names, [
			`${urlPrefix}spec/fixtures/url-relative/one.js`,
			`${urlPrefix}spec/fixtures/url-relative/two.js`
		]);
		for (const pair of sources.pairs) {
			strictEqual(typeof pair.content, 'string');
		}
		const {errors, warnings} = stats.compilation;
		deepStrictEqual(errors, []);
		deepStrictEqual(warnings, []);
	});

	test(`${istr}: url-encoded`, async () => {
		const {stats, map} = await webpackMemory(webpack, {
			entry: './spec/fixtures/url-encoded/min'
		});
		const mapData = JSON.parse(map);
		const sources = listSources(mapData);
		deepStrictEqual(sources.names, [
			`${urlPrefix}spec/fixtures/url-encoded/one.js`,
			`${urlPrefix}spec/fixtures/url-encoded/two.js`
		]);
		for (const pair of sources.pairs) {
			strictEqual(typeof pair.content, 'string');
		}
		const {errors, warnings} = stats.compilation;
		deepStrictEqual(errors, []);
		deepStrictEqual(warnings, []);
	});

	test(`${istr}: url-decoded`, async () => {
		const {stats, map} = await webpackMemory(webpack, {
			entry: './spec/fixtures/url-decoded/min'
		});
		const mapData = JSON.parse(map);
		const sources = listSources(mapData);
		deepStrictEqual(sources.names, [
			`${urlPrefix}spec/fixtures/url-decoded/one.js`,
			`${urlPrefix}spec/fixtures/url-decoded/two.js`
		]);
		for (const pair of sources.pairs) {
			strictEqual(typeof pair.content, 'string');
		}
		const {errors, warnings} = stats.compilation;
		deepStrictEqual(errors, []);
		deepStrictEqual(warnings, []);
	});

	test(`${istr}: none`, async () => {
		const {stats, map} = await webpackMemory(webpack, {
			entry: './spec/fixtures/none/min'
		});
		const mapData = JSON.parse(map);
		const sources = listSources(mapData);
		deepStrictEqual(sources.names, [
			`${urlPrefix}./spec/fixtures/none/min.js`
		]);
		for (const pair of sources.pairs) {
			strictEqual(typeof pair.content, 'string');
		}
		const {errors, warnings} = stats.compilation;
		deepStrictEqual(errors, []);
		deepStrictEqual(warnings, []);
	});

	test(`${istr}: external-missing-one`, async () => {
		const {stats, map} = await webpackMemory(webpack, {
			entry: './spec/fixtures/external-missing-one/min'
		});
		const mapData = JSON.parse(map);
		const sources = listSources(mapData);
		deepStrictEqual(sources.names, [
			`${urlPrefix}./spec/fixtures/external-missing-one/min.js`
		]);
		for (const pair of sources.pairs) {
			strictEqual(typeof pair.content, 'string');
		}
		const {errors, warnings} = stats.compilation;
		deepStrictEqual(errors, []);
		strictEqual(warnings.length, 1);
		const {message} = warnings[0].warning;
		strictEqual(message.indexOf(exceptionMessagePrefix), 0);
	});

	test(`${istr}: external-missing-all`, async () => {
		const {stats, map} = await webpackMemory(webpack, {
			entry: './spec/fixtures/external-missing-all/min'
		});
		const mapData = JSON.parse(map);
		const sources = listSources(mapData);
		deepStrictEqual(sources.names, [
			`${urlPrefix}./spec/fixtures/external-missing-all/min.js`
		]);
		for (const pair of sources.pairs) {
			strictEqual(typeof pair.content, 'string');
		}
		const {errors, warnings} = stats.compilation;
		deepStrictEqual(errors, []);
		strictEqual(warnings.length, 1);
		const {message} = warnings[0].warning;
		strictEqual(message.indexOf(exceptionMessagePrefix), 0);
	});

	test(`${istr}: datauri-bad`, async () => {
		const {stats, map} = await webpackMemory(webpack, {
			entry: './spec/fixtures/datauri-bad/min'
		});
		const mapData = JSON.parse(map);
		const sources = listSources(mapData);
		deepStrictEqual(sources.names, [
			`${urlPrefix}./spec/fixtures/datauri-bad/min.js`
		]);
		for (const pair of sources.pairs) {
			strictEqual(typeof pair.content, 'string');
		}
		const {errors, warnings} = stats.compilation;
		deepStrictEqual(errors, []);
		strictEqual(warnings.length, 1);
		const {message} = warnings[0].warning;
		strictEqual(message.indexOf(exceptionMessagePrefix), 0);
	});

	test(`${istr}: map-json-invalid`, async () => {
		const {stats, map} = await webpackMemory(webpack, {
			entry: './spec/fixtures/map-json-invalid/min'
		});
		const mapData = JSON.parse(map);
		const sources = listSources(mapData);
		deepStrictEqual(sources.names, [
			`${urlPrefix}./spec/fixtures/map-json-invalid/min.js`
		]);
		for (const pair of sources.pairs) {
			strictEqual(typeof pair.content, 'string');
		}
		const {errors, warnings} = stats.compilation;
		deepStrictEqual(errors, []);
		strictEqual(warnings.length, 1);
		const {message} = warnings[0].warning;
		strictEqual(message.indexOf(exceptionMessagePrefix), 0);
	});
}

const webpacks = nodeRequireFunction()(path.resolve('spec/webpacks'));
for (const version of Object.keys(webpacks)) {
	testFixtures(version, webpacks[version]);
}
