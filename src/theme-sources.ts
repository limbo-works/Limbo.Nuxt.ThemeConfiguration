import { stat } from 'node:fs/promises';
import { basename, isAbsolute, relative, resolve } from 'node:path';
import { createJiti } from 'jiti';
import { resolveAlias, resolveFiles, resolvePath } from '@nuxt/kit';
import {
	normalizeThemeConfiguration,
	unwrapThemeModule,
} from './runtime/shared/normalize-theme-configuration';
import type {
	ThemeConfiguration,
	ThemeFileSource,
	ThemeSourceOptions,
	ThemeSourceTransformer,
} from './runtime/utils/theme-configuration.types';

const defaultFiles = 'theme-configuration.*.{js,cjs,mjs,ts,cts,mts}';

function validateJson(value: unknown, seen = new Set<object>()): void {
	if (
		value === null ||
		typeof value === 'string' ||
		typeof value === 'boolean'
	)
		return;
	if (typeof value === 'number' && Number.isFinite(value)) return;
	if (typeof value !== 'object' || seen.has(value))
		throw new Error(
			'transformed theme must contain only JSON-compatible values and no cycles.'
		);
	const prototype = Object.getPrototypeOf(value);
	if (
		!Array.isArray(value) &&
		prototype !== Object.prototype &&
		prototype !== null
	)
		throw new Error(
			'transformed theme must contain only plain objects and arrays.'
		);
	seen.add(value);
	for (const item of Array.isArray(value) ? value : Object.values(value))
		validateJson(item, seen);
	seen.delete(value);
}

export interface DiscoveredTheme {
	name: string;
	paths: string[];
	data?: ThemeConfiguration;
}

export async function discoverThemeSources(
	options: ThemeSourceOptions = {},
	srcDir: string,
	rootDir: string,
	alias: Record<string, string> = {}
): Promise<DiscoveredTheme[]> {
	const sources: ThemeFileSource[] = [
		...(options.includeDefault === false
			? []
			: [
					{
						paths: [
							'assets/js/theme-configuration.*.{js,cjs,mjs,ts,cts,mts}',
						],
					},
				]),
		...(options.entries ?? []),
	];
	const jiti = createJiti(import.meta.url, {
		alias,
		moduleCache: false,
		fsCache: false,
	});
	const themes: DiscoveredTheme[] = [];
	for (const [sourceIndex, source] of sources.entries()) {
		if (!Array.isArray(source.paths) || !source.paths.length)
			throw new Error(
				'themeConfiguration: each source must have at least one path.'
			);
		let namePattern: RegExp | undefined;
		if (source.namePattern !== undefined) {
			try {
				namePattern = new RegExp(source.namePattern);
			} catch (error) {
				throw new Error(
					`themeConfiguration: invalid source namePattern "${source.namePattern}".`,
					{ cause: error }
				);
			}
		}
		let transform: ThemeSourceTransformer | undefined;
		if (typeof source.transform === 'string') {
			const path = await resolvePath(source.transform, {
				cwd: rootDir,
				alias,
			});
			const loaded: unknown = await jiti.import(path, { default: true });
			if (typeof loaded !== 'function')
				throw new Error(
					`themeConfiguration: source transformer "${source.transform}" must default-export a function.`
				);
			transform = loaded as ThemeSourceTransformer;
		} else if (source.transform !== undefined) {
			if (typeof source.transform !== 'function')
				throw new Error(
					'themeConfiguration: source transformer must be a function or module path.'
				);
			transform = source.transform;
		}
		const paths = new Set<string>();
		for (const input of source.paths) {
			if (typeof input !== 'string' || !input)
				throw new Error(
					'themeConfiguration: source paths must be non-empty strings.'
				);
			const resolved = resolveAlias(input, alias);
			const path = isAbsolute(resolved)
				? resolved
				: resolve(srcDir, resolved);
			let isDirectory = false;
			try {
				isDirectory = (await stat(path)).isDirectory();
			} catch (error) {
				if ((error as NodeJS.ErrnoException).code !== 'ENOENT')
					throw error;
				if (!/[*?{}[\]]/.test(path))
					throw new Error(
						`themeConfiguration: source path "${input}" does not exist.`,
						{ cause: error }
					);
			}
			const found = await resolveFiles(
				isDirectory ? path : srcDir,
				isDirectory ? (source.files ?? defaultFiles) : path
			);
			for (const file of found) paths.add(file.replaceAll('\\', '/'));
		}
		if (!paths.size) {
			if (!(sourceIndex === 0 && options.includeDefault !== false))
				console.warn(
					`themeConfiguration: no theme files matched source ${source.paths.join(', ')}.`
				);
			continue;
		}
		const groups: Array<[string, string[]]> = [];
		for (const path of paths) {
			const filename = basename(path);
			const match = namePattern?.exec(filename);
			if (namePattern && !match) continue;
			const name =
				source.name ??
				(namePattern
					? (match?.groups?.name ?? match?.[1])
					: (filename.match(
							/^theme-configuration\.([a-zA-Z0-9_-]+)\./
						)?.[1] ?? filename.replace(/\.[^.]+$/, '')));
			if (
				!name ||
				!/^[a-zA-Z0-9_-]+$/.test(name) ||
				Object.hasOwn(Object.prototype, name)
			)
				throw new Error(
					`themeConfiguration: could not derive a valid theme name from "${path}".`
				);
			if (source.name && groups.length) groups[0]![1].push(path);
			else groups.push([name, [path]]);
		}
		if (!groups.length)
			throw new Error(
				`themeConfiguration: namePattern matched no files in source ${source.paths.join(', ')}.`
			);
		for (const [name, files] of groups) {
			if (files.length > 1 && !transform)
				throw new Error(
					`themeConfiguration: theme "${name}" has multiple files but no transformer: ${files.join(', ')}.`
				);
			let data: ThemeConfiguration | undefined;
			if (transform) {
				try {
					const inputs = await Promise.all(
						files.map(async (path) => ({
							path,
							data: await jiti.import(path, { default: true }),
						}))
					);
					const result = await transform(inputs, { name });
					data = normalizeThemeConfiguration(
						unwrapThemeModule(result)
					);
					validateJson(data);
				} catch (error) {
					throw new Error(
						`themeConfiguration: failed to transform theme "${name}" from ${files.join(', ')}.`,
						{ cause: error }
					);
				}
			}
			themes.push({ name, paths: files, data });
		}
	}
	return themes;
}

export function renderThemeSources(
	themes: DiscoveredTheme[],
	srcDir: string
): string {
	const loaders = themes.map((theme) =>
		theme.data === undefined
			? `() => import(${JSON.stringify(theme.paths[0])})`
			: `() => JSON.parse(${JSON.stringify(JSON.stringify(theme.data))})`
	);
	const definitions = loaders.map(
		(loader, index) => `const theme${index} = ${loader};`
	);
	const entries = themes.map(
		(theme, index) => `[${JSON.stringify(theme.name)}, theme${index}]`
	);
	const paths = themes.flatMap((theme, index) =>
		theme.paths.flatMap((path) =>
			sourcePathKeys(path, srcDir).map(
				(key) => `[${JSON.stringify(key)}, theme${index}]`
			)
		)
	);
	return `${definitions.join('\n')}\nexport const themeLoaders = Object.fromEntries([${entries.join(', ')}]);\nexport const fileLoaders = Object.fromEntries([${paths.join(', ')}]);\n`;
}

export function sourcePathKeys(path: string, srcDir: string): string[] {
	const rel = relative(srcDir, path).replaceAll('\\', '/');
	return [
		path,
		!rel.startsWith('../') && !isAbsolute(rel) ? `~/${rel}` : path,
	];
}
