import {ok, strictEqual} from 'assert';

import {data} from './uri';

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
	test(`data: ${uri}`, () => {
		const d = data(uri);
		if (info) {
			ok(d !== null);
			strictEqual(d.mediaType, info.mediaType);
			strictEqual(d.mimeType, info.mimeType);
			strictEqual(d.charset, info.charset);
			strictEqual(d.base64, info.base64);
			strictEqual(d.data, info.data);
			strictEqual(d.text(), info.body);
		} else {
			strictEqual(d, null);
		}
	});
}
