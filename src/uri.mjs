const US_ASCII = 'US-ASCII';

/**
 * Decode percents in string.
 *
 * @param {string} s The string to decode.
 * @returns {string|null} Decoded string or null.
 */
export function decodePercents(s) {
	try {
		return decodeURIComponent(s);
		// eslint-disable-next-line no-unused-vars
	} catch (err) {
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
	const mediaType = base64
		? mediaInfo.substring(0, mediaInfo.length - 5)
		: mediaInfo;
	const [mimeType] = mediaType.split(';', 1);
	const m2 = mediaType.match(/;charset=([^;]*)(;|$)/iu);
	const charset = (m2 ? m2[1] : '') || US_ASCII;
	return {
		mediaType,
		mimeType,
		charset,
		base64,
		data,

		/**
		 * Get body.
		 *
		 * @returns {Buffer} Buffer data.
		 */
		body() {
			return Buffer.from(
				decodePercents(this.data),
				this.base64 ? 'base64' : 'utf8'
			);
		},

		/**
		 * Get body as text.
		 *
		 * @returns {string} Text data.
		 */
		text() {
			const {charset} = this;
			return this.body().toString(
				charset.toUpperCase() === US_ASCII ? 'ascii' : charset
			);
		}
	};
}
