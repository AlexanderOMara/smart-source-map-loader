/* eslint-env jasmine */

import {Exception} from './exception';
import {NAME} from './meta';

describe('exception', () => {
	it('message', () => {
		const msg = 'hello';
		const ex = new Exception(msg);
		expect(ex.message).toBe(`${NAME}: ${msg}`);
	});

	it('message empty', () => {
		const ex = new Exception('');
		expect(ex.message).toBe(`${NAME}: `);
	});
});
