export default async function getThemeConfigurationsAsync() {
	const appConfig = useAppConfig();

	const configGlobs = import.meta.glob(
		'~/assets/js/theme-configuration.*.(js|cjs|mjs)',
		{ as: 'json' }
	);

	Object.assign(configGlobs, extractThemeConfigurationsFromAppConfig(appConfig), configGlobs);

	const themeConfigurations = {};
	const loadedConfigs = new Map();

	try {
		for (const key in configGlobs) {
			const themeName = key.match(
				/theme-configuration\.([a-zA-Z0-9_-]+)\./
			)?.[1] || key;

			// Cache loaded configurations to prevent re-importing
			if (!loadedConfigs.has(key)) {
				const config = (await configGlobs[key]())?.default;
				loadedConfigs.set(key, config);
				themeConfigurations[themeName] = config;
			} else {
				themeConfigurations[themeName] = loadedConfigs.get(key);
			}
		}
	} finally {
		// Clear references to prevent memory leaks
		if (import.meta.server) {
			loadedConfigs.clear();
		}
	}

	return themeConfigurations;
};
