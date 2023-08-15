import {strictEqual} from 'assert';

import {NAME, VERSION} from './meta';

test('NAME', () => {
	strictEqual(typeof NAME, 'string');
});

test('VERSION', () => {
	strictEqual(typeof VERSION, 'string');
});
