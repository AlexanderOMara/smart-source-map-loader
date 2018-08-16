import url from 'url';
import path from 'path';
import fs from 'fs';

const rURL = /^(?:[\w+\-.]+:)?\/\//;
const rDataURI = /^data:/i;

export function nullUndefined(value) {
	// eslint-disable-next-line no-undefined
	return value === null || value === undefined;
}

export function isAbsoluteURL(uri) {
	if (uri[0] === '/') {
		return true;
	}
	return rURL.test(uri);
}

export function isDataURI(uri) {
	return rDataURI.test(uri);
}

export function joinURL(...parts) {
	return parts.join('/');
}

export function resolveURL(from, to) {
	return url.resolve(from, to).replace(/\/$/, '');
}

export function rebaseURL(from, to) {
	if (isAbsoluteURL(to) || isDataURI(to)) {
		return to;
	}
	return resolveURL(from, to);
}

export function sourceMapMappings(map) {
	const {sections} = map;
	return sections ? sections.map(e => e.map) : [map];
}

export function sourceMapRebase(map, base) {
	for (const mapping of sourceMapMappings(map)) {
		mapping.sourceRoot = rebaseURL(base, mapping.sourceRoot || '.');
	}
}

export function pathRelativeIfSub(from, to) {
	return to.indexOf(from) ? to : path.relative(from, to);
}

export function stringAbbrev(str, max, suffix = '') {
	if (str.length <= max) {
		return str;
	}
	return str.substr(0, max - suffix.length) + suffix;
}

export function decodeURISafe(path) {
	try {
		return decodeURI(path);
	}
	catch (err) {
		// Do nothing.
	}
	return null;
}

export function stringOrBufferCast(data, ...args) {
	if (typeof data === 'string') {
		return data;
	}
	return data.toString(...args);
}

export function readFileAsync(path, options) {
	const r = new Promise((resolve, reject) => {
		fs.readFile(path, options, (err, data) => {
			if (err) {
				reject(err);
				return;
			}
			resolve(data);
		});
	});
	return r;
}
