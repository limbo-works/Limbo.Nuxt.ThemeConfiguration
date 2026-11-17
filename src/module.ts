import {
	addComponent,
	addImportsDir,
	addPlugin,
	addTemplate,
	addTypeTemplate,
	createResolver,
	defineNuxtModule,
	resolvePath,
} from '@nuxt/kit';
import { createJiti } from 'jiti';
import type {} from '@unocss/nuxt';
import { deepmerge } from './runtime/shared/helpers';
import { resolveRules } from './runtime/shared/rule-helpers/registry';
import { unwrapThemeModule } from './runtime/shared/normalize-theme-configuration';
import extractThemeConfigurationsFromAppConfig from './runtime/utils/extractThemeConfigurationsFromAppConfig';
import {
	discoverThemeSources,
	renderThemeSources,
	sourcePathKeys,
} from './theme-sources';
import type {
	ThemeConfiguration,
	ThemeModuleOptions,
	ThemeOptions,
	ThemeRuleRegistry,
} from './runtime/utils/theme-configuration.types';

export type ModuleOptions = ThemeModuleOptions;

declare module 'nuxt/schema' {
	interface NuxtConfig {
		themeConfiguration?: ModuleOptions;
	}
	interface PublicRuntimeConfig {
		themeConfiguration?: ThemeOptions;
	}
}

export default defineNuxtModule<ModuleOptions>({
	meta: {
		name: '@limbo-works/theme-configuration',
		configKey: 'themeConfiguration',
	},
	async setup(options, nuxt) {
		const { resolve } = createResolver(import.meta.url);
		const jiti = createJiti(import.meta.url, { alias: nuxt.options.alias });
		const {
			rules: rulePaths = {},
			uno = true,
			sources = {},
			...defaults
		} = options;
		const themes = await discoverThemeSources(
			sources,
			nuxt.options.srcDir,
			nuxt.options.rootDir,
			nuxt.options.alias
		);
		const themesTemplate = addTemplate({
			filename: 'theme-configuration/themes.mjs',
			write: true,
			getContents: () => renderThemeSources(themes, nuxt.options.srcDir),
		});
		nuxt.options.alias['#theme-configuration/themes'] = themesTemplate.dst;
		const overrides: ThemeRuleRegistry = {};
		const imports: string[] = [];
		const entries: string[] = [];
		for (const [key, path] of Object.entries(rulePaths)) {
			if (path === false) {
				overrides[key] = false;
				entries.push(`${JSON.stringify(key)}: false`);
				continue;
			}
			const resolved = await resolvePath(path, {
				cwd: nuxt.options.rootDir,
				alias: nuxt.options.alias,
			});
			const name = `rule${imports.length}`;
			imports.push(`import ${name} from ${JSON.stringify(resolved)};`);
			entries.push(`${JSON.stringify(key)}: ${name}`);
			overrides[key] = await jiti.import(resolved, { default: true });
		}
		resolveRules(overrides);
		const template = addTemplate({
			filename: 'theme-configuration/rules.mjs',
			getContents: () =>
				`${imports.join('\n')}\nexport default { ${entries.join(',\n')} };`,
		});
		nuxt.options.alias['#theme-configuration/rules'] = template.dst;
		addTypeTemplate({
			filename: 'types/theme-configuration.d.ts',
			write: true,
			getContents: () => `declare module '#theme-configuration/rules' {
	import type { ThemeRuleRegistry } from ${JSON.stringify(resolve('./runtime/utils/theme-configuration.types'))};
	const rules: ThemeRuleRegistry;
	export default rules;
}
declare module '#theme-configuration/themes' {
	import type { ThemeLoaders } from ${JSON.stringify(resolve('./runtime/utils/theme-configuration.types'))};
	export const themeLoaders: ThemeLoaders;
	export const fileLoaders: ThemeLoaders;
}`,
		});

		nuxt.options.runtimeConfig.public.themeConfiguration = defaults;

		if (uno) {
			nuxt.hook('unocss:config', async (config) => {
				const name = sources.unoTheme ?? 'default';
				const selected = themes.findLast(
					(theme) => theme.name === name
				);
				let theme: ThemeConfiguration = {};
				if (selected) {
					theme =
						selected.data ??
						unwrapThemeModule(
							await jiti.import(selected.paths[0]!)
						);
				} else {
					const loaders = extractThemeConfigurationsFromAppConfig(
						nuxt.options.appConfig,
						Object.fromEntries(
							themes.flatMap((theme) =>
								theme.paths.flatMap((path) =>
									sourcePathKeys(
										path,
										nuxt.options.srcDir
									).map((key) => [
										key,
										async () =>
											theme.data ??
											unwrapThemeModule(
												await jiti.import(path)
											),
									])
								)
							)
						)
					);
					const loaded = await loaders[name]?.();
					if (loaded) theme = unwrapThemeModule(loaded);
					else if (sources.unoTheme)
						throw new Error(
							`themeConfiguration: UnoCSS theme "${name}" not found.`
						);
				}
				const { makeUnoTheme } =
					await import('./runtime/shared/helpers.uno.ts');
				const generated = makeUnoTheme(theme, defaults, overrides);
				config.theme = deepmerge(
					{ ...generated.theme },
					{ ...config.theme }
				);
				config.rules = [...generated.rules, ...(config.rules ?? [])];
				config.variants = [
					...generated.variants,
					...(config.variants ?? []),
				];
			});
		}

		addPlugin(resolve('./runtime/plugins/theme-configuration'));
		addComponent({
			name: 'ThemeConfiguration',
			filePath: resolve('./runtime/components/ThemeConfiguration.vue'),
		});
		addImportsDir([
			resolve('./runtime/composables'),
			resolve('./runtime/utils'),
		]);
	},
});
