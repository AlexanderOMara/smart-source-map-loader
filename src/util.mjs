import {join as pathJoin} from 'path';
import {readFile} from 'fs';

const rURL = /^([a-z][a-z0-9.-]*:\/?\/?[^/]*|\/\/[^/]*|)([^?#]*)(.*)$/i;
const rProto = /^[a-z][a-z0-9-.]*:/i;
const rDataURI = /^data:/i;

/**
 * Check if absolute URL.
 *
 * @param {string} uri URL strng.
 * @returns {boolean} Is absolute.
 */
export function isAbsoluteURL(uri) {
	return uri[0] === '/' || rProto.test(uri);
}

/**
 * Check if data URI.
 *
 * @param {string} uri URI strng.
 * @returns {boolean} Is a data URI.
 */
export function isDataURI(uri) {
	return rDataURI.test(uri);
}

/**
 * Clean a URL path of extra dot notation.
 *
 * @param {string} path URL pathname.
 * @returns Normalized pathname.
 */
export function pathResolve(path) {
	let p = path;
	// Multiple slashes to slash.
	p = p.replace(/\/\/+/g, '/');
	// Dot slash.
	p = p.replace(/^(\.\/)+/, '');
	// Trailing slash dot to slash.
	p = p.replace(/\/\.$/, '/');
	// Dot slash path components.
	p = p.replace(/\/(\.\/)+/g, '/');
	for (;;) {
		// Leading, middle, and trailing, dot dot slash resolving.
		const v = p.replace(/(^|\/)(?!\.\.)[^/]+\/\.\.(\/|$)/g, '$1');
		if (v === p) {
			break;
		}
		p = v;
	}
	return p === '.' ? '' : p;
}

/**
 * Rebase a URL path.
 *
 * @param {string} from From path.
 * @param {string} to To path.
 * @returns {string} Full path.
 */
export function rebaseURL(from, to) {
	if (isAbsoluteURL(to) || isDataURI(to)) {
		return to;
	}
	const [, fb, fp] = from.match(rURL);
	const [, , tp, te] = to.match(rURL);
	const path = tp ? pathResolve(fp.replace(/[^/]+$/, '') + tp) : fp;
	return fb + (fb && path[0] !== '/' ? '/' : '') + path + te;
}

/**
 * Get source mappings maps.
 *
 * @param {object} map Map object.
 * @returns {Array} Maps array.
 */
export function sourceMapMappings(map) {
	const {sections} = map;
	return sections ? sections.map(e => e.map) : [map];
}

/**
 * Rebase source mappings sourceRoot.
 *
 * @param {object} map Map object.
 * @param {string} base Base path.
 */
export function sourceMapRebase(map, base) {
	for (const mapping of sourceMapMappings(map)) {
		mapping.sourceRoot = rebaseURL(base, mapping.sourceRoot || '.');
	}
}

/**
 * Get relative path if a subpath, else unchaged.
 *
 * @param {string} from From path.
 * @param {string} to To path.
 * @returns {string} Resulting path.
 */
export function pathRelativeIfSub(from, to) {
	if (from === to) {
		return '';
	}
	if (!from) {
		return to;
	}
	const pre = pathJoin(from, '_').replace(/_$/, '');
	return to.substring(0, pre.length) === pre ? to.substring(pre.length) : to;
}

/**
 * Abbreviate a string if too long.
 *
 * @param {string} str String.
 * @param {number} max String max length.
 * @param {string} suffix Suffix to use if too long.
 * @returns {string} Abbreviated or original string.
 */
export function stringAbbrev(str, max, suffix = '') {
	return str.length > max
		? str.substring(0, max - suffix.length) + suffix
		: str;
}

/**
 * Decode URL returning null on error.
 *
 * @param {string} str The string to decode.
 * @returns {string|null} Decoded string or null.
 */
export function decodeURISafe(str) {
	try {
		return decodeURI(str);
		// eslint-disable-next-line no-unused-vars
	} catch (err) {
		// Do nothing.
	}
	return null;
}

/**
 * Read a file asyncronousely.
 *
 * @param {string} path File path.
 * @param {string|object} options File read options.
 * @returns {Buffer|string} The file data.
 */
export function readFileAsync(path, options) {
	const r = new Promise((resolve, reject) => {
		readFile(path, options, (err, data) => {
			if (err) {
				reject(err);
				return;
			}
			resolve(data);
		});
	});
	return r;
}
