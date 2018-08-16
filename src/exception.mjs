import {NAME} from './meta';

export class Exception extends Error {
	constructor(message) {
		super(`${NAME}: ${message}`);
	}
}
