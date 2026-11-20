import { afterEach, test } from 'vitest';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import { createJiti } from 'jiti';
import { loadNuxt } from '@nuxt/kit';

const jiti = createJiti(import.meta.url);
const { discoverThemeSources, renderThemeSources } = await jiti.import(
	'../src/theme-sources.ts'
);
const { default: extractFromAppConfig } = await jiti.import(
	'../src/runtime/utils/extractThemeConfigurationsFromAppConfig.ts'
);
let root;
async function fixture() {
	root = await mkdtemp(join(tmpdir(), 'theme-sources-'));
	await mkdir(join(root, 'assets/js'), { recursive: true });
	await mkdir(join(root, 'tokens'), { recursive: true });
	await writeFile(
		join(root, 'assets/js/theme-configuration.default.js'),
		'export default { spacing: { gap: 1 } }'
	);
	await writeFile(
		join(root, 'assets/js/theme-configuration.print.ts'),
		'export default { spacing: { gap: 2 } }'
	);
	await writeFile(join(root, 'tokens/main-light.json'), '{"gap":3}');
	await writeFile(join(root, 'tokens/main-dark.json'), '{"gap":4}');
}
afterEach(async () => {
	if (root) await rm(root, { recursive: true, force: true });
	root = undefined;
});

test('default discovery and configurable directories, regex names, precedence, and inline transforms', async () => {
	await fixture();
	const sources = await discoverThemeSources(
		{
			entries: [
				{
					paths: ['tokens'],
					files: '*.json',
					namePattern: '^main-(?<name>.+)\\.json$',
					transform: ([file]) => ({
						spacing: { gap: file.data.gap },
					}),
				},
				{
					paths: ['tokens/main-dark.json'],
					name: 'default',
					transform: ([file]) => ({
						spacing: { gap: file.data.gap },
					}),
				},
			],
		},
		root,
		root
	);
	assert.deepEqual(
		sources.map(({ name }) => name),
		['default', 'print', 'dark', 'light', 'default']
	);
	assert.equal(sources.at(-1).data.spacing.gap, 4);
	assert.equal(
		sources.find(({ name }) => name === 'light').data.spacing.gap,
		3
	);
	const registry = join(root, 'registry.mjs');
	await writeFile(registry, renderThemeSources(sources, root));
	const loaded = await import(pathToFileURL(registry).href);
	assert.equal((await loaded.themeLoaders.default()).spacing.gap, 4);
	assert.equal((await loaded.themeLoaders.print()).default.spacing.gap, 2);
	assert.equal(
		(
			await loaded.fileLoaders[
				'~/assets/js/theme-configuration.default.js'
			]()
		).default.spacing.gap,
		1
	);
	assert.equal(
		(await loaded.fileLoaders['~/tokens/main-light.json']()).spacing.gap,
		3
	);
	const alias = extractFromAppConfig(
		{
			themeConfiguration: {
				themes: [{ name: 'alias', path: '~/tokens/main-light.json' }],
			},
		},
		loaded.fileLoaders
	);
	assert.equal((await alias.alias()).spacing.gap, 3);
});

test('module transformer aggregates explicit files and paths preserve order', async () => {
	await fixture();
	await writeFile(
		join(root, 'transform.mjs'),
		'export default async (files, { name }) => ({ spacing: { [name]: files.reduce((sum, file) => sum + file.data.gap, 0) } })'
	);
	const sources = await discoverThemeSources(
		{
			includeDefault: false,
			entries: [
				{
					paths: ['tokens/main-light.json', 'tokens/main-dark.json'],
					name: 'combined',
					transform: './transform.mjs',
				},
			],
		},
		root,
		root
	);
	assert.deepEqual(
		sources.map(({ name }) => name),
		['combined']
	);
	assert.deepEqual(
		sources[0].paths.map((path) => path.split('/').at(-1)),
		['main-light.json', 'main-dark.json']
	);
	assert.equal(sources[0].data.spacing.combined, 7);
});

test('Nuxt UnoCSS hook selects the same transformed theme used by runtime', async () => {
	await fixture();
	const nuxt = await loadNuxt({
		cwd: join(process.cwd(), '.playground'),
		dev: false,
		overrides: {
			buildDir: join(root, 'nuxt-build'),
			themeConfiguration: { sources: { unoTheme: 'tokenBundle' } },
		},
	});
	try {
		const config = { theme: {}, rules: [], variants: [] };
		await nuxt.callHook('unocss:config', config);
		assert.equal(
			config.theme.colors.primary,
			'rgb(var(--theme-colors-primary, 12 34 56))'
		);
		assert.ok(config.rules.length > 0);
		assert.equal(
			nuxt.options.runtimeConfig.public.themeConfiguration.sources,
			undefined
		);
	} finally {
		await nuxt.close();
	}
});

test('UnoCSS selection resolves app.config aliases to transformed file sources', async () => {
	await fixture();
	const nuxt = await loadNuxt({
		cwd: join(process.cwd(), '.playground'),
		dev: false,
		overrides: {
			buildDir: join(root, 'nuxt-alias-build'),
			themeConfiguration: { sources: { unoTheme: 'bundleAlias' } },
		},
	});
	try {
		nuxt.options.appConfig.themeConfiguration = {
			themes: [
				{
					name: 'bundleAlias',
					path: '~/assets/generated/test-tokens/colors.json',
				},
			],
		};
		const config = { theme: {}, rules: [], variants: [] };
		await nuxt.callHook('unocss:config', config);
		assert.equal(
			config.theme.colors.primary,
			'rgb(var(--theme-colors-primary, 12 34 56))'
		);
	} finally {
		await nuxt.close();
	}
});

test('invalid sources, grouped files, transformers, names, and output fail explicitly', async () => {
	await fixture();
	for (const entry of [
		{ paths: [] },
		{ paths: ['missing.json'] },
		{ paths: ['tokens/*.json'], namePattern: '[' },
		{ paths: ['tokens/*.json'], namePattern: '^no-match-(.+)' },
		{ paths: ['tokens/*.json'], name: 'joined' },
		{
			paths: ['tokens/*.json'],
			name: 'joined',
			transform: () => ({ spacing: { gap: Infinity } }),
		},
		{
			paths: ['tokens/*.json'],
			name: 'joined',
			transform: () => ({ spacing: new Array(1) }),
		},
		{
			paths: ['tokens/*.json'],
			name: 'joined',
			transform: () => {
				throw new Error('bad tokens');
			},
		},
	]) {
		await assert.rejects(() =>
			discoverThemeSources(
				{ includeDefault: false, entries: [entry] },
				root,
				root
			)
		);
	}
});
