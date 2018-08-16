/* eslint-env jasmine */

import path from 'path';

import {
	nullUndefined,
	isAbsoluteURL,
	isDataURI,
	joinURL,
	resolveURL,
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
		' ONE.foo = function (bar) {\n' +
		'   return baz(bar);\n' +
		' };',
		' TWO.inc = function (n) {\n' +
		'   return n + 1;\n' +
		' };'
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
					' TWO.inc = function (n) {\n' +
					'   return n + 1;\n' +
					' };'
				],
				names: ['n'],
				mappings: 'CAAC,IAAI,IAAM,SAAUA,GAClB,OAAOA',
				file: 'min.js',
				sourceRoot: ''
			}
		}
	]
});

describe('util', () => {
	describe('nullUndefined', () => {
		it('true', () => {
			expect(nullUndefined(null)).toBe(true);
			// eslint-disable-next-line no-undefined
			expect(nullUndefined(undefined)).toBe(true);
			expect(nullUndefined()).toBe(true);
		});

		it('false', () => {
			expect(nullUndefined(false)).toBe(false);
			expect(nullUndefined(true)).toBe(false);
			expect(nullUndefined(NaN)).toBe(false);
		});
	});

	describe('isAbsoluteURL', () => {
		it('true', () => {
			expect(isAbsoluteURL('/')).toBe(true);
			expect(isAbsoluteURL('//')).toBe(true);
			expect(isAbsoluteURL('http://')).toBe(true);
			expect(isAbsoluteURL('https://')).toBe(true);
			expect(isAbsoluteURL('ftp://')).toBe(true);
		});

		it('false', () => {
			expect(isAbsoluteURL('.')).toBe(false);
			expect(isAbsoluteURL('./')).toBe(false);
			expect(isAbsoluteURL('path')).toBe(false);
			expect(isAbsoluteURL('./path')).toBe(false);
			expect(isAbsoluteURL('path/slashes')).toBe(false);
			expect(isAbsoluteURL('./path/slashes')).toBe(false);
			expect(isAbsoluteURL('data:')).toBe(false);
		});
	});

	describe('isDataURI', () => {
		it('true', () => {
			expect(isDataURI('data:')).toBe(true);
			expect(isDataURI('DaTa:')).toBe(true);
			expect(isDataURI('DATA:')).toBe(true);
			expect(isDataURI('data:test/plain;charset=utf-8;base64,'))
				.toBe(true);
		});

		it('false', () => {
			expect(isDataURI('http:')).toBe(false);
			expect(isDataURI('https:')).toBe(false);
			expect(isDataURI('data')).toBe(false);
			expect(isDataURI('./data:')).toBe(false);
			expect(isDataURI('/data:')).toBe(false);
			expect(isDataURI('_data:')).toBe(false);
		});
	});

	describe('joinURL', () => {
		it('1', () => {
			expect(joinURL('.')).toBe('.');
		});

		it('2', () => {
			expect(joinURL('.', 'test')).toBe('./test');
			expect(joinURL('aaa', 'bbb')).toBe('aaa/bbb');
		});

		it('3', () => {
			expect(joinURL('.', 'aaa', 'bbb')).toBe('./aaa/bbb');
			expect(joinURL('aaa', 'bbb', 'ccc')).toBe('aaa/bbb/ccc');
		});
	});

	describe('resolveURL', () => {
		it('relative', () => {
			expect(resolveURL('aaa/file', 'bbb')).toBe('aaa/bbb');
			expect(resolveURL('aaa/file', './bbb')).toBe('aaa/bbb');
			expect(resolveURL('aaa/file', '../bbb')).toBe('bbb');
			expect(resolveURL('aaa/file', '')).toBe('aaa/file');
			expect(resolveURL('aaa/file', '.')).toBe('aaa');
			expect(resolveURL('aaa/file', './')).toBe('aaa');
		});

		it('absolute', () => {
			expect(resolveURL('/aaa/file', '/bbb')).toBe('/bbb');
			expect(resolveURL('/a/b', 'http://example.com/'))
				.toBe('http://example.com');
		});
	});

	describe('rebaseURL', () => {
		it('relative', () => {
			expect(rebaseURL('aaa/file', 'bbb')).toBe('aaa/bbb');
			expect(rebaseURL('aaa/file', './bbb')).toBe('aaa/bbb');
			expect(rebaseURL('aaa/file', '../bbb')).toBe('bbb');
			expect(rebaseURL('aaa/file', '')).toBe('aaa/file');
			expect(rebaseURL('aaa/file', '.')).toBe('aaa');
			expect(rebaseURL('aaa/file', './')).toBe('aaa');
		});

		it('absolute', () => {
			expect(rebaseURL('/aaa/file', '/bbb')).toBe('/bbb');
			expect(rebaseURL('/a/b', 'http://example.com/'))
				.toBe('http://example.com/');
		});

		it('data URI', () => {
			expect(rebaseURL('file', 'data:')).toBe('data:');
			expect(rebaseURL('/aaa/file', 'data:')).toBe('data:');
		});
	});

	describe('sourceMapMappings', () => {
		it('single', () => {
			const map = JSON.parse(mapSingle);
			const mappings = sourceMapMappings(map);

			expect(mappings.length).toBe(1);
			expect(mappings[0]).toBe(map);
		});

		it('indexed', () => {
			const map = JSON.parse(mapIndexed);
			const mappings = sourceMapMappings(map);

			expect(mappings.length).toBe(2);
			expect(mappings[0]).toBe(map.sections[0].map);
			expect(mappings[1]).toBe(map.sections[1].map);
		});
	});

	describe('sourceMapRebase', () => {
		for (const info of [
			['', 'test/file.js.map', 'test'],
			['.', 'test/file.js.map', 'test'],
			['./', 'test/file.js.map', 'test'],
			['..', 'test/file.js.map', ''],
			['../other', 'test/file.js.map', 'other'],
			[null, '', '']
		]) {
			const [root, path, result] = info;

			describe(info.map(e => JSON.stringify(e)).join(' '), () => {
				it('single', () => {
					const map = JSON.parse(mapSingle);
					map.sourceRoot = root;
					sourceMapRebase(map, path);
					expect(map.sourceRoot).toBe(result);
				});

				it('indexed', () => {
					const map = JSON.parse(mapSingle);
					for (const mapping of sourceMapMappings(map)) {
						mapping.sourceRoot = root;
					}
					sourceMapRebase(map, path);
					for (const mapping of sourceMapMappings(map)) {
						expect(mapping.sourceRoot).toBe(result);
					}
				});
			});
		}
	});

	describe('pathRelativeIfSub', () => {
		it('relative', () => {
			expect(pathRelativeIfSub(
				path.join('path', 'aaa', 'bbb'),
				path.join('path', 'aaa', 'bbb', 'ccc')
			))
				.toBe('ccc');
		});

		it('parent', () => {
			expect(pathRelativeIfSub(
				path.join('path', 'aaa', 'bbb', 'ccc'),
				path.join('path', 'aaa', 'bbb')
			))
				.toBe(path.join('path', 'aaa', 'bbb'));
		});

		it('sibling', () => {
			expect(pathRelativeIfSub(
				path.join('path', 'dira'),
				path.join('path', 'dirb')
			))
				.toBe(path.join('path', 'dirb'));
		});

		it('root', () => {
			expect(pathRelativeIfSub(
				path.join('path', 'dira'),
				path.join('path', 'dirb')
			))
				.toBe(path.join('path', 'dirb'));
		});
	});

	describe('stringAbbrev', () => {
		it('-1', () => {
			expect(stringAbbrev('abcdefg', 8)).toBe('abcdefg');
		});

		it('0', () => {
			expect(stringAbbrev('abcdefg', 7)).toBe('abcdefg');
		});

		it('+1', () => {
			expect(stringAbbrev('abcdefg', 6)).toBe('abcdef');
		});

		it('+1 ...', () => {
			expect(stringAbbrev('abcdefg', 6, '...')).toBe('abc...');
		});
	});

	describe('decodeURISafe', () => {
		it('valid', () => {
			expect(decodeURISafe('testing%20123')).toBe('testing 123');
		});

		it('invalid', () => {
			expect(decodeURISafe('%%')).toBe(null);
		});
	});

	describe('stringOrBufferCast', () => {
		it('string', () => {
			expect(stringOrBufferCast('hello')).toBe('hello');
		});

		it('buffer', () => {
			expect(stringOrBufferCast(Buffer.from('hello'))).toBe('hello');
		});
	});

	describe('readFileAsync', () => {
		it('pass', async () => {
			const pkg = JSON.parse(await readFileAsync('package.json', 'utf8'));
			expect(typeof pkg).toBe('object');
		});

		it('fail', async () => {
			const path = 'spec/fixtures/does-not-exist';
			let error = null;
			try {
				await readFileAsync(path, 'utf8');
			}
			catch (err) {
				error = err;
			}

			expect(typeof error.path).toBe('string');
		});
	});
});
