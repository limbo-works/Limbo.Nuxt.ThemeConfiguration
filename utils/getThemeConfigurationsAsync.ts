import type { ThemeLoaders } from './theme-configuration.types';

export default async function getThemeConfigurationsAsync() {
	const configGlobs = {
		...import.meta.glob('~/assets/js/theme-configuration.*.js'),
		...import.meta.glob('~/assets/js/theme-configuration.*.cjs'),
		...import.meta.glob('~/assets/js/theme-configuration.*.mjs'),
		...import.meta.glob('~/assets/js/theme-configuration.*.ts'),
		...import.meta.glob('~/assets/js/theme-configuration.*.cts'),
		...import.meta.glob('~/assets/js/theme-configuration.*.mts'),
	};
	const extracted = extractThemeConfigurationsFromAppConfig(useAppConfig());

	if (Object.keys(extracted).length > 0) {
		Object.assign(configGlobs, extracted, configGlobs); // Local first, always
	}

	const themeLoaders: ThemeLoaders = {};
	for (const key in configGlobs) {
		const match = key.match(/theme-configuration\.([a-zA-Z0-9_-]+)\./);
		const loaderKey = match?.[1] || key;
		themeLoaders[loaderKey] = configGlobs[key] as ThemeLoaders[string];
	}

	return themeLoaders;
}
