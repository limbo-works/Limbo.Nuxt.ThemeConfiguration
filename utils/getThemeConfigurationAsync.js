export default async function getThemeConfigurationAsync(theme, subset) {
	const { $themeConfigurations = {} } = useNuxtApp();

	let config = undefined;
	if (typeof theme === 'string') {
		let themeConfig = $themeConfigurations[theme];

		if (themeConfig && typeof themeConfig === 'object' && typeof themeConfig.then !== 'function') {
			// Theme is already loaded
			config = { ...themeConfig };
		} else if (!themeConfig && $themeConfigurations.$loadTheme) {
			// Try to load theme using the loader function
			try {
				const loadedConfig = await $themeConfigurations.$loadTheme(theme);
				if (loadedConfig) {
					config = { ...loadedConfig };
				}
			} catch (error) {
				console.warn(`Failed to load theme configuration "${theme}":`, error);
			}
		} else if (!themeConfig) {
			console.warn(`Theme "${theme}" not found. Available themes:`, Object.keys($themeConfigurations).filter(key => !key.startsWith('$')));
		}
	} else if (typeof theme === 'object') {
		config = { ...theme };
	}

	if (subset) {
		config = getThemeConfigurationSubset(config, subset);
	}

	return config;
}
