import {resolve as urlResolve} from 'url';
import {relative as pathRelative} from 'path';
import {readFile} from 'fs';

const rURL = /^(?:[\w+\-.]+:)?\/\//;
const rDataURI = /^data:/i;

/**
 * Check if value if null or undefined.
 *
 * @param {*} value Any value.
 * @returns {boolean} Is either.
 */
export function nullUndefined(value) {
	// eslint-disable-next-line no-undefined
	return value === null || value === undefined;
}

/**
 * Check if absolute URL.
 *
 * @param {string} uri URL strng.
 * @returns {boolean} Is absolute.
 */
export function isAbsoluteURL(uri) {
	if (uri[0] === '/') {
		return true;
	}
	return rURL.test(uri);
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
 * Join URL parts on seperator character.
 *
 * @param {Array} parts URL parts.
 * @returns {string} Joined path.
 */
export function joinURL(...parts) {
	return parts.join('/');
}

/**
 * Resolve a URL path with no trailing slash.
 *
 * @param {string} from From path.
 * @param {string} to To path.
 * @returns {string} Full path.
 */
export function resolveURL(from, to) {
	return urlResolve(from, to).replace(/\/$/, '');
}

/**
 * Rebase a URL path with no trailing slash.
 *
 * @param {string} from From path.
 * @param {string} to To path.
 * @returns {string} Full path.
 */
export function rebaseURL(from, to) {
	if (isAbsoluteURL(to) || isDataURI(to)) {
		return to;
	}
	return resolveURL(from, to);
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
	return to.indexOf(from) ? to : pathRelative(from, to);
}

/**
 * Abbreviate a string if too long.
 *
 * @param {string} str String.
 * @param {number} max String max length.
 * @param {string} [suffix=''] Suffix to use if too long.
 * @returns {string} Abbreviated or original string.
 */
export function stringAbbrev(str, max, suffix = '') {
	if (str.length <= max) {
		return str;
	}
	return str.substr(0, max - suffix.length) + suffix;
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
	} catch (err) {
		// Do nothing.
	}
	return null;
}

/**
 * Convert string or Buffer to string.
 *
 * @param {string|Buffer} data String or Buffer data.
 * @param {Array} args Optional arguments to pass to Buffer toString method.
 * @returns {string} String value.
 */
export function stringOrBufferCast(data, ...args) {
	if (typeof data === 'string') {
		return data;
	}
	return data.toString(...args);
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
