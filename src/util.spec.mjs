import {strictEqual} from 'assert';
import path from 'path';

import {
	isAbsoluteURL,
	isDataURI,
	pathResolve,
	rebaseURL,
	sourceMapMappings,
	sourceMapRebase,
	pathRelativeIfSub,
	stringAbbrev,
	decodeURISafe,
	stringOrBufferCast,
	readFileAsync
} from './util';

const mapSingle = JSON.stringify({
	version: 3,
	file: 'min.js',
	names: ['bar', 'baz', 'n'],
	sources: ['one.js', 'two.js'],
	sourcesContent: [
		' ONE.foo = function (bar) {\n   return baz(bar);\n };',
		' TWO.inc = function (n) {\n   return n + 1;\n };'
	],
	sourceRoot: '',
	mappings:
		'CAAC,IAAI,IAAM,SAAUA,GAClB,OAAOC,IAAID;' +
		'CCDb,IAAI,IAAM,SAAUE,GAClB,OAAOA'
});
const mapIndexed = JSON.stringify({
	version: 3,
	file: 'min.js',
	sections: [
		{
			offset: {
				line: 0,
				column: 0
			},
			map: {
				version: 3,
				sources: ['one.js'],
				sourcesContent: [
					' ONE.foo = function (bar) {\n' +
						'   return baz(bar);\n' +
						' };'
				],
				names: ['bar', 'baz'],
				mappings: 'CAAC,IAAI,IAAM,SAAUA,GAClB,OAAOC,IAAID',
				file: 'min.js',
				sourceRoot: ''
			}
		},
		{
			offset: {
				line: 1,
				column: 0
			},
			map: {
				version: 3,
				sources: ['two.js'],
				sourcesContent: [
					' TWO.inc = function (n) {\n   return n + 1;\n };'
				],
				names: ['n'],
				mappings: 'CAAC,IAAI,IAAM,SAAUA,GAClB,OAAOA',
				file: 'min.js',
				sourceRoot: ''
			}
		}
	]
});

test('isAbsoluteURL: true', () => {
	strictEqual(isAbsoluteURL('/'), true);
	strictEqual(isAbsoluteURL('//'), true);
	strictEqual(isAbsoluteURL('http://'), true);
	strictEqual(isAbsoluteURL('https://'), true);
	strictEqual(isAbsoluteURL('ftp://'), true);
});

test('isAbsoluteURL: false', () => {
	strictEqual(isAbsoluteURL('.'), false);
	strictEqual(isAbsoluteURL('./'), false);
	strictEqual(isAbsoluteURL('path'), false);
	strictEqual(isAbsoluteURL('./path'), false);
	strictEqual(isAbsoluteURL('path/slashes'), false);
	strictEqual(isAbsoluteURL('./path/slashes'), false);
});

test('isDataURI: true', () => {
	strictEqual(isDataURI('data:'), true);
	strictEqual(isDataURI('DaTa:'), true);
	strictEqual(isDataURI('DATA:'), true);
	strictEqual(isDataURI('data:test/plain;charset=utf-8;base64,'), true);
});

test('isDataURI: false', () => {
	strictEqual(isDataURI('http:'), false);
	strictEqual(isDataURI('https:'), false);
	strictEqual(isDataURI('data'), false);
	strictEqual(isDataURI('./data:'), false);
	strictEqual(isDataURI('/data:'), false);
	strictEqual(isDataURI('_data:'), false);
});

test('pathResolve: double slash', () => {
	strictEqual(pathResolve('/aa//bb/'), '/aa/bb/');
});

test('pathResolve: just dot', () => {
	strictEqual(pathResolve('.'), '');
});

test('pathResolve: dot slash', () => {
	strictEqual(pathResolve('./aa'), 'aa');
	strictEqual(pathResolve('/aa/.'), '/aa/');
	strictEqual(pathResolve('/aa/./bb/./cc/'), '/aa/bb/cc/');
	strictEqual(pathResolve('/aa/././bb/././cc/'), '/aa/bb/cc/');
});

test('pathResolve: dot dot slash', () => {
	strictEqual(pathResolve('/aa/..'), '/');
	strictEqual(pathResolve('/aa/bb/..'), '/aa/');
	strictEqual(pathResolve('/aa/bb/../'), '/aa/');
	strictEqual(pathResolve('/aa/bb/../../aa/bb/../'), '/aa/');
	strictEqual(pathResolve('../../../aa'), '../../../aa');
});

test('rebaseURL: relative', () => {
	strictEqual(rebaseURL('aaa/file', 'bbb'), 'aaa/bbb');
	strictEqual(rebaseURL('aaa/file', './bbb'), 'aaa/bbb');
	strictEqual(rebaseURL('aaa/file', '../bbb'), 'bbb');
	strictEqual(rebaseURL('aaa/file', ''), 'aaa/file');
	strictEqual(rebaseURL('aaa/file', '.'), 'aaa/');
	strictEqual(rebaseURL('aaa/file', './'), 'aaa/');
});

test('rebaseURL: absolute', () => {
	strictEqual(rebaseURL('/aaa/file', '/bbb'), '/bbb');
	strictEqual(
		rebaseURL('/a/b', 'http://example.com/'),
		'http://example.com/'
	);
});

test('rebaseURL: data URI', () => {
	strictEqual(rebaseURL('file', 'data:'), 'data:');
	strictEqual(rebaseURL('/aaa/file', 'data:'), 'data:');
});

test('sourceMapMappings: single', () => {
	const map = JSON.parse(mapSingle);
	const mappings = sourceMapMappings(map);

	strictEqual(mappings.length, 1);
	strictEqual(mappings[0], map);
});

test('sourceMapMappings: indexed', () => {
	const map = JSON.parse(mapIndexed);
	const mappings = sourceMapMappings(map);

	strictEqual(mappings.length, 2);
	strictEqual(mappings[0], map.sections[0].map);
	strictEqual(mappings[1], map.sections[1].map);
});

for (const info of [
	['', 'test/file.js.map', 'test/'],
	['.', 'test/file.js.map', 'test/'],
	['./', 'test/file.js.map', 'test/'],
	['..', 'test/file.js.map', ''],
	['../other', 'test/file.js.map', 'other'],
	[null, '', '']
]) {
	const [root, path, result] = info;
	const istr = info.map(e => JSON.stringify(e)).join(' ');

	test(`sourceMapRebase: ${istr}: single`, () => {
		const map = JSON.parse(mapSingle);
		map.sourceRoot = root;
		sourceMapRebase(map, path);
		strictEqual(map.sourceRoot, result);
	});

	test(`sourceMapRebase: ${istr}: indexed`, () => {
		const map = JSON.parse(mapSingle);
		for (const mapping of sourceMapMappings(map)) {
			mapping.sourceRoot = root;
		}
		sourceMapRebase(map, path);
		for (const mapping of sourceMapMappings(map)) {
			strictEqual(mapping.sourceRoot, result);
		}
	});
}

test('pathRelativeIfSub: relative', () => {
	strictEqual(
		pathRelativeIfSub(
			path.join('path', 'aaa', 'bbb'),
			path.join('path', 'aaa', 'bbb', 'ccc')
		),
		'ccc'
	);
});

test('pathRelativeIfSub: parent', () => {
	strictEqual(
		pathRelativeIfSub(
			path.join('path', 'aaa', 'bbb', 'ccc'),
			path.join('path', 'aaa', 'bbb')
		),
		path.join('path', 'aaa', 'bbb')
	);
});

test('pathRelativeIfSub: sibling', () => {
	strictEqual(
		pathRelativeIfSub(path.join('path', 'dira'), path.join('path', 'dirb')),
		path.join('path', 'dirb')
	);
});

test('pathRelativeIfSub: root', () => {
	strictEqual(
		pathRelativeIfSub(path.join('path', 'dira'), path.join('path', 'dirb')),
		path.join('path', 'dirb')
	);
});

test('stringAbbrev: -1', () => {
	strictEqual(stringAbbrev('abcdefg', 8), 'abcdefg');
});

test('stringAbbrev: 0', () => {
	strictEqual(stringAbbrev('abcdefg', 7), 'abcdefg');
});

test('stringAbbrev: +1', () => {
	strictEqual(stringAbbrev('abcdefg', 6), 'abcdef');
});

test('stringAbbrev: +1 ...', () => {
	strictEqual(stringAbbrev('abcdefg', 6, '...'), 'abc...');
});

test('decodeURISafe: valid', () => {
	strictEqual(decodeURISafe('testing%20123'), 'testing 123');
});

test('decodeURISafe: invalid', () => {
	strictEqual(decodeURISafe('%%'), null);
});

test('stringOrBufferCast: string', () => {
	strictEqual(stringOrBufferCast('hello'), 'hello');
});

test('stringOrBufferCast: buffer', () => {
	strictEqual(stringOrBufferCast(Buffer.from('hello')), 'hello');
});

test('readFileAsync: pass', async () => {
	const pkg = JSON.parse(await readFileAsync('package.json', 'utf8'));
	strictEqual(typeof pkg, 'object');
});

test('readFileAsync: fail', async () => {
	const path = 'spec/fixtures/does-not-exist';
	let error = null;
	try {
		await readFileAsync(path, 'utf8');
	} catch (err) {
		error = err;
	}

	strictEqual(typeof error.path, 'string');
});
