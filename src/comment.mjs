import {
	decodeURISafe
} from './util';

const rDirective = '([@#][ \\t]+sourceMappingURL=([^\r\n]*[^\\s]+))';
const rCommentLine = `(\\/\\/${rDirective}[ \\t]*)`;
const rCommentBlock = `(\\/\\*${rDirective}[ \\t]*\\*\\/)`;
const rComments = `(${rCommentLine}|${rCommentBlock})`;
const rCommentEnd = `(${rComments}\\s*)$`;
const rCommentEndMatch = new RegExp(rCommentEnd);

export function parse(code) {
	const m = code.match(rCommentEndMatch);
	if (!m) {
		return null;
	}

	// eslint-disable-next-line prefer-destructuring
	const footer = m[0];
	// eslint-disable-next-line prefer-destructuring
	const comment = m[2];
	const directive = m[4] || m[7];
	const url = m[5] || m[8];
	const body = code.substr(0, code.length - footer.length);

	return {
		body,
		footer,
		comment,
		directive,
		url
	};
}

export function pathsFromURL(url) {
	const decoded = decodeURISafe(url);
	if (decoded && decoded !== url) {
		return [url, decoded];
	}
	return [url];
}
