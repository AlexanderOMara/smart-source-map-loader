import {strictEqual} from 'assert';

import {Exception} from './exception';
import {NAME} from './meta';

test('exception: message', () => {
	const msg = 'hello';
	const ex = new Exception(msg);
	strictEqual(ex.message, `${NAME}: ${msg}`);
});

test('exception: message empty', () => {
	const ex = new Exception('');
	strictEqual(ex.message, `${NAME}: `);
});
