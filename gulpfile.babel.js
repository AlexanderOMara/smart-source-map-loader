import path from 'path';

import fse from 'fs-extra';
import gulp from 'gulp';
import gulpRename from 'gulp-rename';
import gulpInsert from 'gulp-insert';
import gulpFilter from 'gulp-filter';
import gulpReplace from 'gulp-replace';
import gulpSourcemaps from 'gulp-sourcemaps';
import gulpBabel from 'gulp-babel';
import pump from 'pump';

async function pumpP(...args) {
	const r = await new Promise((resolve, reject) => {
		const r = pump(...args, err => {
			if (err) {
				reject(err);
				return;
			}
			resolve(r);
		});
	});
	return r;
}

async function packageJSON() {
	packageJSON.json = packageJSON.json || fse.readFile('package.json', 'utf8');
	return JSON.parse(await packageJSON.json);
}

async function babelrc() {
	babelrc.json = babelrc.json || fse.readFile('.babelrc', 'utf8');
	const r = JSON.parse(await babelrc.json);

	// Prevent .babelrc file from being loaded again by the plugin.
	r.babelrc = false;
	return r;
}

function babelrcGetEnv(opts) {
	for (const preset of opts.presets) {
		if (preset[0] === '@babel/preset-env') {
			return preset[1];
		}
	}
	return null;
}

async function babelLib(modules) {
	const src = ['src/**/*.mjs'];
	const dest = 'lib';

	const babelOptions = await babelrc();
	babelrcGetEnv(babelOptions).modules = modules ? false : 'commonjs';

	// Read the package JSON.
	const pkg = await packageJSON();

	// Filter meta data file and create replace transform.
	const filterMeta = gulpFilter(['*/meta.mjs'], {restore: true});
	const filterMetaReplaces = [
		["'@VERSION@'", JSON.stringify(pkg.version)],
		["'@NAME@'", JSON.stringify(pkg.name)]
	].map(v => gulpReplace(...v));

	await pumpP(
		gulp.src(src),
		filterMeta,
		...filterMetaReplaces,
		filterMeta.restore,
		gulpSourcemaps.init(),
		gulpBabel(babelOptions),
		gulpRename(path => {
			if (modules && path.extname === '.js') {
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
	);
}

export async function buildLibCjs() {
	await babelLib(false);
}
