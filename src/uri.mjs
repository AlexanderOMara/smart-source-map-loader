/**
 * Decode percents in string.
 *
 * @param {string} s The string to decode.
 * @returns {string|null} Decoded string or null.
 */
export function decodePercents(s) {
	try {
		return decodeURIComponent(s);
	}
	catch (err) {
		// Do nothing.
	}
	return null;
}

/**
 * Parse a data URI.
 *
 * @param {string} uri Data URI.
 * @returns {object} Parsed data.
 */
export function data(uri) {
	const m1 = uri.match(/^data:([^,]*),([\s\S]*)$/iu);
	if (!m1) {
		return null;
	}
	const [, mediaInfo, data] = m1;
	const base64 = /;base64$/iu.test(mediaInfo);
	const mediaType = base64 ?
		mediaInfo.substr(0, mediaInfo.length - 5) :
		mediaInfo;
	const [mimeType] = mediaType.split(';', 1);
	const m2 = mediaType.match(/;charset=([^;]*)(;|$)/iu);
	const charset = (m2 ? m2[1] : '') || 'US-ASCII';
	return {
		mediaType,
		mimeType,
		charset,
		base64,
		data,
		body() {
			return Buffer.from(
				decodePercents(data),
				base64 ? 'base64' : 'utf8'
			);
		}
	};
}
