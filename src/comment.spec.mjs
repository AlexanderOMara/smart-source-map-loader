/* eslint-env jasmine */

import {parse, pathsFromURL} from './comment';

const code = '(function(){})()';
const urlFile = 'file.js.map';
const urlBase64 = 'data:application/source-map;charset=utf-8;base64,e30%3D';

// Invalid according to spec (should be percent encoded).
// Many tools ignore that spec however so included to support such tools.
const urlFileSpace = 'file spaced.js.map';

function stringRepeat(str, rep) {
	return new Array(rep + 1).join(str);
}

function createSample(nl, d, url, block, spaces, lines) {
	const body = code + nl;
	const directive = `${d} sourceMappingURL=${url}`;
	const comment =
		(block ? '/*' : '//') +
		directive +
		stringRepeat(' ', spaces) +
		(block ? '*/' : '');
	const footer = comment + stringRepeat(nl, lines);
	const all = body + footer;
	return {
		all,
		body,
		footer,
		comment,
		directive,
		url
	};
}

function testSample(nl, d, url, block, spaces, lines) {
	const sample = createSample(nl, d, urlFile, block, spaces, lines);
	const parsed = parse(sample.all);

	expect(parsed.body).toBe(sample.body);
	expect(parsed.footer).toBe(sample.footer);
	expect(parsed.comment).toBe(sample.comment);
	expect(parsed.directive).toBe(sample.directive);
	expect(parsed.url).toBe(sample.url);
}

describe('comment', () => {
	describe('parse', () => {
		for (const nl of ['\n', '\r', '\r\n']) {
			describe(`newline: ${JSON.stringify(nl)}`, () => {
				it('line comment', () => {
					testSample(nl, '#', urlFile, false, 0, 0);
				});

				it('line comment space', () => {
					testSample(nl, '#', urlFile, false, 1, 0);
				});

				it('line comment spaces', () => {
					testSample(nl, '#', urlFile, false, 2, 0);
				});

				it('line comment newline', () => {
					testSample(nl, '#', urlFile, false, 0, 1);
				});

				it('line comment newlines', () => {
					testSample(nl, '#', urlFile, false, 0, 2);
				});

				it('line comment base64', () => {
					testSample(nl, '#', urlBase64, false, 0, 0);
				});

				it('line comment obsolete', () => {
					testSample(nl, '@', urlFile, false, 0, 0);
				});

				it('line comment space in name', () => {
					testSample(nl, '#', urlFileSpace, false, 0, 0);
				});

				it('block comment', () => {
					testSample(nl, '#', urlFile, true, 0, 0);
				});

				it('block comment space', () => {
					testSample(nl, '#', urlFile, true, 1, 0);
				});

				it('block comment spaces', () => {
					testSample(nl, '#', urlFile, true, 2, 0);
				});

				it('block comment newline', () => {
					testSample(nl, '#', urlFile, true, 0, 1);
				});

				it('block comment newlines', () => {
					testSample(nl, '#', urlFile, true, 0, 2);
				});

				it('block comment base64', () => {
					testSample(nl, '#', urlBase64, true, 0, 0);
				});

				it('block comment obsolete', () => {
					testSample(nl, '@', urlFile, true, 0, 0);
				});

				it('block comment space in name', () => {
					testSample(nl, '#', urlFileSpace, true, 0, 0);
				});

				it('ignore comment in body', () => {
					const parsed = parse(
						[
							'(function() {',
							'//#sourceMappingURL=file.js.map',
							'})()'
						].join(nl)
					);
					expect(parsed).toBe(null);
				});

				it('ignore comment before code', () => {
					const parsed = parse(
						[
							'(function() {})()',
							'//#sourceMappingURL=file.js.map',
							';'
						].join(nl)
					);
					expect(parsed).toBe(null);
				});

				it('ignore comment not last line+line', () => {
					const parsed = parse(
						['//#sourceMappingURL=file.js.map', '//'].join(nl)
					);
					expect(parsed).toBe(null);
				});

				it('ignore comment not last line+block', () => {
					const parsed = parse(
						['//#sourceMappingURL=file.js.map', '/**/'].join(nl)
					);
					expect(parsed).toBe(null);
				});

				it('ignore comment not last block+block', () => {
					const parsed = parse(
						['/*#sourceMappingURL=file.js.map*/', '/**/'].join(nl)
					);
					expect(parsed).toBe(null);
				});

				it('ignore comment not last block+line', () => {
					const parsed = parse(
						['/*#sourceMappingURL=file.js.map*/', '//'].join(nl)
					);
					expect(parsed).toBe(null);
				});
			});
		}
	});

	describe('pathsFromURL', () => {
		it('single', () => {
			const path = 'test ing.js.map';
			const paths = pathsFromURL(path);
			expect(paths).toEqual([path]);
		});

		it('multiple', () => {
			const path = 'test%20ing.js.map';
			const paths = pathsFromURL(path);
			expect(paths).toEqual([path, decodeURI(path)]);
		});
	});
});
