export default async function getThemeConfigurationsAsync() {
	const configGlobs = import.meta.glob('~/assets/js/theme-configuration.*.(js|cjs|mjs)');
	const extracted = extractThemeConfigurationsFromAppConfig(useAppConfig());

	if (Object.keys(extracted).length > 0) {
		Object.assign(configGlobs, extracted);
	}

	const themeLoaders = {};
	for (const key in configGlobs) {
		const match = key.match(/theme-configuration\.([a-zA-Z0-9_-]+)\./);
		themeLoaders[match ? match[1] : key] = configGlobs[key];
	}

	return themeLoaders;
};

