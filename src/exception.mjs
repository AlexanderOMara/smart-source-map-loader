import {NAME} from './meta';

/**
 * Exception class.
 */
export class Exception extends Error {
	/**
	 * Exception constructor.
	 *
	 * @param {string} message Exception message.
	 */
	constructor(message) {
		super(`${NAME}: ${message}`);
	}
}
