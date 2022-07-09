export * from './meta';

import {dirname as pathDirname} from 'path';

import loaderUtils from 'loader-utils';

import {
	nullUndefined,
	isDataURI,
	joinURL,
	sourceMapMappings,
	sourceMapRebase,
	pathRelativeIfSub,
	stringAbbrev,
	stringOrBufferCast,
	readFileAsync
} from './util';
import {data} from './uri';
import {Exception} from './exception';
import {
	parse as commentParse,
	pathsFromURL as commentPathsFromURL
} from './comment';

/**
 * Create resolver.
 *
 * @param {Function} resolve Resolve function.
 * @returns {Function} Resolve function.
 */
function createResolver(resolve) {
	const res = resolve;
	return async function (context, request) {
		const r = await new Promise((resolve, reject) => {
			res(context, request, (err, result) => {
				if (err) {
					reject(err);
					return;
				}
				resolve(result);
			});
		});
		return r;
	};
}

/**
 * Create resolver multiple from a resolver.
 *
 * @param {Function} resolver Resolve function.
 * @returns {Function} Resolve function.
 */
function createResolverMulti(resolver) {
	return async function (context, requests) {
		for (const request of requests) {
			try {
				// eslint-disable-next-line no-await-in-loop
				return await resolver(context, request);
			} catch (err) {
				// Do nothing.
			}
		}
		return null;
	};
}

// eslint-disable-next-line import/no-default-export, jsdoc/require-jsdoc, no-unused-vars
export default async function (source, map, meta) {
	// eslint-disable-next-line no-invalid-this
	const self = this;

	const callback = self.async();

	const {
		resolve,
		addDependency,
		emitWarning,
		sourceMap,
		context,
		rootContext,
		resourcePath
	} = self;

	const resolver = createResolver(resolve);
	const resolverMulti = createResolverMulti(resolver);

	// If passed a buffer then convert to a string or emit warning and skip.
	let sourceString = null;
	try {
		sourceString = stringOrBufferCast(source, 'utf8');
	} catch (err) {
		emitWarning(new Exception(`Failed to cast source to string: ${err}`));
		// eslint-disable-next-line prefer-rest-params
		callback(null, ...arguments);
		return;
	}

	// Parse source map comment or pass the arguments straight through.
	const parsed = commentParse(sourceString);
	if (!parsed) {
		// eslint-disable-next-line prefer-rest-params
		callback(null, ...arguments);
		return;
	}

	// If no source map requested, just output code without comment.
	if (!sourceMap) {
		callback(null, parsed.body);
		return;
	}

	let mapFile = null;
	let mapInfo = null;
	let mapCode = null;

	// Check if data URI.
	if (isDataURI(parsed.url)) {
		mapInfo = stringAbbrev(parsed.url, 64, '...');

		// Attempt to parse URL as a data URI.
		const dataURI = data(parsed.url);
		if (!dataURI) {
			emitWarning(new Exception(`Failed to parse data URI: ${mapInfo}`));
			callback(null, parsed.body);
			return;
		}

		// Attempt to decode source map content.
		try {
			mapCode = dataURI.body().toString(dataURI.charset);
		} catch (err) {
			emitWarning(
				new Exception(`Failed to decode data URI: ${mapInfo}: ${err}`)
			);
			callback(null, parsed.body);
			return;
		}

		// Remember which file the source map came from.
		mapFile = resourcePath;
	} else {
		mapInfo = parsed.url;

		// Remove file protocol from the URL if present.
		const mapPath = parsed.url.replace(/^file:\/\//i, '');

		// Create list of possible file paths.
		// Compensates for comments that may not be encoded to spec.
		const mapPaths = commentPathsFromURL(mapPath);

		// Convert those paths to resolvable paths.
		const mapPathsRequest = mapPaths.map(p => loaderUtils.urlToRequest(p));

		// Resolve the first one that exists or null.
		const resolved = await resolverMulti(context, mapPathsRequest);

		// If file not resolved emit warning and skip.
		if (!resolved) {
			emitWarning(
				new Exception(`Failed to resolve source map: ${mapInfo}`)
			);
			callback(null, parsed.body);
			return;
		}

		// Add the file as a dependency.
		addDependency(resolved);

		// Read the file or emit warning and skip.
		try {
			mapCode = await readFileAsync(resolved, 'utf-8');
		} catch (err) {
			emitWarning(
				new Exception(`Failed to read source map: ${mapInfo}: ${err}`)
			);
			callback(null, parsed.body);
			return;
		}

		// Remember which file the source map came from.
		mapFile = resolved;
	}

	// Get context of the file that has the source map.
	const mapFileContext = pathDirname(mapFile);

	// Try to parse the map data.
	let mapData = null;
	try {
		mapData = JSON.parse(mapCode);
	} catch (err) {
		emitWarning(
			new Exception(`Failed to parse source map: ${mapInfo}: ${err}`)
		);
		callback(null, parsed.body);
		return;
	}

	// Loop over the sections to ensure source content.
	const mapMappings = sourceMapMappings(mapData);
	for (const mapping of mapMappings) {
		const {sources} = mapping;
		if (!sources) {
			continue;
		}
		const sourceRoot = mapping.sourceRoot || '.';

		// Get list of sources or create empty list.
		const sourcesContent = (mapping.sourcesContent =
			mapping.sourcesContent || []);

		// Loop over the sources looking for missing content.
		for (let i = 0; i < sources.length; i++) {
			const source = sources[i];
			const sourceContent = sourcesContent[i];

			// If has content or source is a data URI, nothing to read.
			if (!nullUndefined(sourceContent) || isDataURI(source)) {
				continue;
			}

			// Locate the source file.
			const sourcePath = joinURL(sourceRoot, source);
			const sourceRequest = loaderUtils.urlToRequest(sourcePath);

			// Resolve source file or emit warning and skip.
			let resolved = null;
			try {
				// eslint-disable-next-line no-await-in-loop
				resolved = await resolver(mapFileContext, sourceRequest);
			} catch (err) {
				const info = `${mapInfo} -> ${sourceRequest}`;
				emitWarning(
					new Exception(
						`Failed to resolve source file: ${info}: ${err}`
					)
				);
				callback(null, parsed.body);
				return;
			}

			// Add the file as a dependency.
			addDependency(resolved);

			// Read the file or emit warning and skip.
			let sourceCode = null;
			try {
				// eslint-disable-next-line no-await-in-loop
				sourceCode = await readFileAsync(resolved, 'utf-8');
			} catch (err) {
				const info = `${mapInfo} -> ${sourceRequest}`;
				emitWarning(
					new Exception(`Failed to read source file: ${info}: ${err}`)
				);
				callback(null, parsed.body);
				return;
			}

			// Add source content to the list.
			sourcesContent[i] = sourceCode;
		}
	}

	// Get the path to the source map, relative if possible.
	const mapFilePath = pathRelativeIfSub(rootContext, mapFile);

	// Rebase the source map base to the source map file.
	// This way webpack will have the real path to the source file.
	sourceMapRebase(mapData, mapFilePath);

	// All good, pass the body and parsed source map out.
	callback(null, parsed.body, mapData);
}
