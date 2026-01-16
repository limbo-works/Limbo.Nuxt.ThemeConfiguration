export default async function getThemeConfigurationsAsync() {
	const appConfig = useAppConfig();
	const configGlobs = import.meta.glob('~/assets/js/theme-configuration.*.(js|cjs|mjs)');

	Object.assign(configGlobs, extractThemeConfigurationsFromAppConfig(appConfig));

	const themeLoaders = {};
	for (const key of Object.keys(configGlobs)) {
		const match = key.match(/theme-configuration\.([a-zA-Z0-9_-]+)\./);
		themeLoaders[match ? match[1] : key] = configGlobs[key];
	}

	return themeLoaders;
};

