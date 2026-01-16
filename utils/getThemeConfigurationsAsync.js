export default async function getThemeConfigurationsAsync() {
	const appConfig = useAppConfig();

	const configGlobs = import.meta.glob(
		'~/assets/js/theme-configuration.*.(js|cjs|mjs)'
	);

	Object.assign(configGlobs, extractThemeConfigurationsFromAppConfig(appConfig));

	// Helper function to get theme name from glob key
	function getThemeNameFromKey(key) {
		const match = key.match(/theme-configuration\.([a-zA-Z0-9_-]+)\./);
		return match ? match[1] : key;
	}

	// Load all themes eagerly to maintain compatibility
	const themeConfigurations = {};

	// Load all available themes
	for (const key of Object.keys(configGlobs)) {
		const themeName = getThemeNameFromKey(key);

		try {
			const config = await configGlobs[key]();
			const themeConfig = config?.default || config;
			if (themeConfig && typeof themeConfig === 'object') {
				// Deep clone to ensure completely serializable plain objects
				themeConfigurations[themeName] = JSON.parse(JSON.stringify(themeConfig));
			}
		} catch (error) {
			console.warn(`Failed to load theme configuration "${themeName}": ${error?.message || String(error)}`);
		}
	}

	// Return a completely plain object to avoid serialization issues
	return JSON.parse(JSON.stringify(themeConfigurations));
};
