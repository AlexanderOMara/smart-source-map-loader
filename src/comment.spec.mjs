import {strictEqual, deepStrictEqual} from 'assert';

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

	strictEqual(parsed.body, sample.body);
	strictEqual(parsed.footer, sample.footer);
	strictEqual(parsed.comment, sample.comment);
	strictEqual(parsed.directive, sample.directive);
	strictEqual(parsed.url, sample.url);
}

for (const nl of ['\n', '\r', '\r\n']) {
	const istr = `parse newline: ${JSON.stringify(nl)}`;

	test(`${istr}: line comment`, () => {
		testSample(nl, '#', urlFile, false, 0, 0);
	});

	test(`${istr}: line comment space`, () => {
		testSample(nl, '#', urlFile, false, 1, 0);
	});

	test(`${istr}: line comment spaces`, () => {
		testSample(nl, '#', urlFile, false, 2, 0);
	});

	test(`${istr}: line comment newline`, () => {
		testSample(nl, '#', urlFile, false, 0, 1);
	});

	test(`${istr}: line comment newlines`, () => {
		testSample(nl, '#', urlFile, false, 0, 2);
	});

	test(`${istr}: line comment base64`, () => {
		testSample(nl, '#', urlBase64, false, 0, 0);
	});

	test(`${istr}: line comment obsolete`, () => {
		testSample(nl, '@', urlFile, false, 0, 0);
	});

	test(`${istr}: line comment space in name`, () => {
		testSample(nl, '#', urlFileSpace, false, 0, 0);
	});

	test(`${istr}: block comment`, () => {
		testSample(nl, '#', urlFile, true, 0, 0);
	});

	test(`${istr}: block comment space`, () => {
		testSample(nl, '#', urlFile, true, 1, 0);
	});

	test(`${istr}: block comment spaces`, () => {
		testSample(nl, '#', urlFile, true, 2, 0);
	});

	test(`${istr}: block comment newline`, () => {
		testSample(nl, '#', urlFile, true, 0, 1);
	});

	test(`${istr}: block comment newlines`, () => {
		testSample(nl, '#', urlFile, true, 0, 2);
	});

	test(`${istr}: block comment base64`, () => {
		testSample(nl, '#', urlBase64, true, 0, 0);
	});

	test(`${istr}: block comment obsolete`, () => {
		testSample(nl, '@', urlFile, true, 0, 0);
	});

	test(`${istr}: block comment space in name`, () => {
		testSample(nl, '#', urlFileSpace, true, 0, 0);
	});

	test(`${istr}: ignore comment in body`, () => {
		const parsed = parse(
			['(function() {', '//#sourceMappingURL=file.js.map', '})()'].join(
				nl
			)
		);
		strictEqual(parsed, null);
	});

	test(`${istr}: ignore comment before code`, () => {
		const parsed = parse(
			['(function() {})()', '//#sourceMappingURL=file.js.map', ';'].join(
				nl
			)
		);
		strictEqual(parsed, null);
	});

	test(`${istr}: ignore comment not last line+line`, () => {
		const parsed = parse(
			['//#sourceMappingURL=file.js.map', '//'].join(nl)
		);
		strictEqual(parsed, null);
	});

	test(`${istr}: ignore comment not last line+block`, () => {
		const parsed = parse(
			['//#sourceMappingURL=file.js.map', '/**/'].join(nl)
		);
		strictEqual(parsed, null);
	});

	test(`${istr}: ignore comment not last block+block`, () => {
		const parsed = parse(
			['/*#sourceMappingURL=file.js.map*/', '/**/'].join(nl)
		);
		strictEqual(parsed, null);
	});

	test(`${istr}: ignore comment not last block+line`, () => {
		const parsed = parse(
			['/*#sourceMappingURL=file.js.map*/', '//'].join(nl)
		);
		strictEqual(parsed, null);
	});
}

test('pathsFromURL: single', () => {
	const path = 'test ing.js.map';
	const paths = pathsFromURL(path);
	deepStrictEqual(paths, [path]);
});

test('pathsFromURL: multiple', () => {
	const path = 'test%20ing.js.map';
	const paths = pathsFromURL(path);
	deepStrictEqual(paths, [path, decodeURI(path)]);
});
