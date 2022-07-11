// eslint-disable-next-line import/no-unassigned-import
import './gulp/polyfill';

import fs from 'fs';
import path from 'path';
import stream from 'stream';
import childProcess from 'child_process';

import gulp from 'gulp';
import gulpRename from 'gulp-rename';
import gulpInsert from 'gulp-insert';
import gulpFilter from 'gulp-filter';
import gulpReplace from 'gulp-replace';
import gulpSourcemaps from 'gulp-sourcemaps';
import gulpBabel from 'gulp-babel';
import del from 'del';
import pump from 'pump';

async function readFile(path, opts = {}) {
	const r = await new Promise((resolve, reject) => {
		fs.readFile(path, opts, (err, data) => {
			if (err) {
				reject(err);
				return;
			}
			resolve(data);
		});
	});
	return r;
}

async function pipeline(...args) {
	const r = await new Promise((resolve, reject) => {
		(stream.pipeline || pump)(...args, (err, data) => {
			if (err) {
				reject(err);
				return;
			}
			resolve(data);
		});
	});
	return r;
}

async function exec(cmd, args = []) {
	const code = await new Promise((resolve, reject) => {
		const p = childProcess.spawn(cmd, args, {
			stdio: 'inherit'
		});
		p.once('close', code => {
			resolve(code);
		});
		p.once('error', err => {
			reject(err);
		});
	});
	if (code) {
		throw new Error(`Exit code: ${code}`);
	}
}

async function packageJson() {
	return JSON.parse(await readFile('package.json', 'utf8'));
}

async function babelrc() {
	return {
		...JSON.parse(await readFile('.babelrc', 'utf8')),
		babelrc: false
	};
}

async function babelTarget(src, dest, modules) {
	// Change module.
	const babelOptions = await babelrc();
	for (const preset of babelOptions.presets) {
		if (preset[0] === '@babel/preset-env') {
			preset[1].modules = modules;
		}
	}

	// Read the package JSON.
	const pkg = await packageJson();

	// Filter meta data file and create replace transform.
	const filterMeta = gulpFilter(['*/meta.ts'], {restore: true});
	const filterMetaReplaces = [
		["'@VERSION@'", JSON.stringify(pkg.version)],
		["'@NAME@'", JSON.stringify(pkg.name)]
	].map(v => gulpReplace(...v));

	await pipeline(
		...[
			gulp.src(src),
			filterMeta,
			...filterMetaReplaces,
			filterMeta.restore,
			gulpSourcemaps.init(),
			gulpBabel(babelOptions),
			gulpRename(path => {
				if (!modules && path.extname === '.js') {
					path.extname = '.mjs';
				}
			}),
			gulpSourcemaps.write('.', {
				includeContent: true,
				addComment: false,
				destPath: dest
			}),
			gulpInsert.transform((contents, file) => {
				// Manually append sourcemap comment.
				if (/\.m?js$/i.test(file.path)) {
					const base = path.basename(file.path);
					return `${contents}\n//# sourceMappingURL=${base}.map\n`;
				}
				return contents;
			}),
			gulp.dest(dest)
		].filter(Boolean)
	);
}

// clean

gulp.task('clean:logs', async () => {
	await del(['npm-debug.log*', 'yarn-debug.log*', 'yarn-error.log*']);
});

gulp.task('clean:lib', async () => {
	await del(['lib']);
});

gulp.task('clean', gulp.parallel(['clean:logs', 'clean:lib']));

// lint

gulp.task('lint:es', async () => {
	await exec('eslint', ['.']);
});

gulp.task('lint', gulp.parallel(['lint:es']));

// formatting

gulp.task('format', async () => {
	await exec('prettier', ['-w', '.']);
});

gulp.task('formatted', async () => {
	await exec('prettier', ['-c', '.']);
});

// build

gulp.task('build:cjs', async () => {
	await babelTarget(['src/**/*.mjs'], 'lib', 'commonjs');
});

gulp.task('build', gulp.parallel(['build:cjs']));

// test

gulp.task('test', async () => {
	await exec('npx', ['jasmine']);
});

// watch

gulp.task('watch', () => {
	gulp.watch(['src/**/*'], gulp.series(['all']));
});

// all

gulp.task('all', gulp.series(['clean', 'build', 'test', 'lint', 'formatted']));

// prepack

gulp.task('prepack', gulp.series(['clean', 'build']));

// default

gulp.task('default', gulp.series(['all']));
