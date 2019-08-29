import {NAME} from './meta';

/**
 * Exception class.
 *
 * @param {string} message Exception message.
 */
export class Exception extends Error {
	constructor(message) {
		super(`${NAME}: ${message}`);
	}
}
