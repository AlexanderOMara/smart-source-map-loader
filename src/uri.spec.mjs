/* eslint-env jasmine */

import {data} from './uri';

describe('uri', () => {
	describe('data', () => {
		for (const [uri, info] of [
			[
				'data:text/vnd-example+xyz;foo=bar;base64,R0lGODdh',
				{
					mediaType: 'text/vnd-example+xyz;foo=bar;b',
					mimeType: 'text/vnd-example+xyz',
					charset: 'US-ASCII',
					base64: true,
					data: 'R0lGODdh',
					body: 'GIF87a'
				}
			],
			[
				'data:text/plain;charset=UTF-8;page=21,the%20data:1234,5678',
				{
					mediaType: 'text/plain;charset=UTF-8;page=21',
					mimeType: 'text/plain',
					charset: 'UTF-8',
					base64: false,
					data: 'the%20data:1234,5678',
					body: 'the data:1234,5678'
				}
			],
			['data:text/plain;', null]
		]) {
			it(uri, () => {
				const d = data(uri);
				if (info) {
					expect(d).not.toBeNull();
					expect(d.mediaType).toBe(info.mediaType);
					expect(d.mimeType).toBe(info.mimeType);
					expect(d.charset).toBe(info.charset);
					expect(d.base64).toBe(info.base64);
					expect(d.data).toBe(info.data);
					expect(d.body().toString()).toBe(info.body);
				} else {
					expect(d).toBeNull();
				}
			});
		}
	});
});
