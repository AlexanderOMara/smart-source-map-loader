'use strict';

require('source-map-support').install();

const {resolve} = require('path');
const {readdirSync, statSync} = require('fs');

function promiser(func) {
	return () => {
		try {
			const p = func();
			if (
				p &&
				typeof p.then === 'function' &&
				typeof p.catch === 'function'
			) {
				return p;
			}
			return Promise.resolve(p);
		} catch (err) {
			return Promise.reject(err);
		}
	};
}

function specs(base) {
	if (!statSync(base).isDirectory()) {
		return [base];
	}
	const r = [];
	for (const q = [base]; q.length; ) {
		const d = q.shift();
		const dirs = [];
		for (const e of readdirSync(d)) {
			if (e[0] === '.') {
				continue;
			}
			const p = `${d}/${e}`;
			if (statSync(p).isDirectory()) {
				dirs.push(p);
			} else if (/\.spec\.js$/i.test(e)) {
				r.push(p);
			}
		}
		q.unshift(...dirs);
	}
	return r;
}

function tests(spec) {
	const r = [];
	const descs = [];
	global.test = function (desc, func) {
		r.push({
			spec,
			desc: [...descs, desc],
			func: promiser(func)
		});
	};
	// eslint-disable-next-line global-require
	require(resolve(spec));
	delete global.test;
	return r;
}

function main() {
	return new Promise(resolve => {
		const args = process.argv.slice(2);
		if (args.length < 1) {
			// eslint-disable-next-line no-console
			console.error('Args: [dir|file]');
			resolve(1);
			return;
		}
		const [dir] = args;
		const queue = [];
		for (const spec of specs(dir)) {
			queue.push(...tests(spec));
		}
		if (!queue.length) {
			// eslint-disable-next-line no-console
			console.error('No test declarations found');
			resolve(1);
			return;
		}
		let pending = 0;
		let passed = 0;
		let failed = 0;
		const ended = () => {
			if (!pending) {
				// eslint-disable-next-line no-console
				console.log(`Passed: ${passed}`);
				// eslint-disable-next-line no-console
				console.log(`Failed: ${failed}`);
				resolve(failed ? 1 : 0);
			}
		};
		for (const test of queue) {
			pending++;
			const name = `${test.spec}: ${test.desc.join(' > ')}`;
			test.func().then(
				// eslint-disable-next-line no-loop-func
				() => {
					pending--;
					passed++;
					// eslint-disable-next-line no-console
					console.log(`+ ${name}`);
					ended();
				},
				// eslint-disable-next-line no-loop-func
				err => {
					pending--;
					failed++;
					// eslint-disable-next-line no-console
					console.log(`- ${name}`);
					// eslint-disable-next-line no-console
					console.log(`${err}`);
					// eslint-disable-next-line no-console
					console.log('');
					ended();
				}
			);
		}
	});
}
main().then(
	code => {
		process.exitCode = code || 0;
	},
	err => {
		// eslint-disable-next-line no-console
		console.error(err);
		process.exitCode = 1;
	}
);
